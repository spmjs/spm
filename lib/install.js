/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var async = require('async');
var color = require('colorful');
var _ = require('lodash');
var spmrc = require('spmrc');
var md5file = require('./utils').md5file;
var tar = require('./utils/tar');
var log = require('./utils/log');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var file = require('./sdk/file');
var mo = require('./sdk/module');

var downloaded = {};

var homedir = spmrc.get('user.home');

module.exports = install;


var config = install.config = {};
var defaults = install.defaults = {
  dest: spmrc.get('install.path'),
  cache: path.join(homedir, '.spm', 'cache'),
  parallel: 1
};
install.fetch = fetch;

function install(options, callback) {
  downloaded = {};
  callback = callback || function() {};
  options = options || {};
  config.parallel = options.parallel || defaults.parallel;
  config.base = options.base || process.cwd();
  config.source = options.source;
  config.cache = options.cache || defaults.cache;
  config.server = options.server;
  config.force = options.force;
  config.save = options.save;
  config.saveDev = options.saveDev;

  var dest = options.destination || defaults.dest;
  config.dest = path.join(config.base, dest);

  var packages;

  var query = options.query;
  if (query && query.length && query[0].charAt(0) !== '.') {
    packages = options.query;
  } else {
    var pkgPath = path.join(config.base, 'package.json');
    packages = parseDependencies(pkgPath, true);
  }

  if (!packages.length) {
    return callback();
  }

  queueInstall(packages, callback, true);
}

function queueInstall(tasks, callback, saveDeps) {
  var errors = [];
  var q = async.queue(function(task, callback) {
    if (typeof task === 'string') {
      task = iduri.resolve(task);
      if (!task) {
        log.error('error', 'invalid module name');
        return;
      }
    }
    spmInstall(task, callback, saveDeps);
  }, config.parallel);

  tasks.forEach(function(task) {
    q.push(task, function(err) {
      if (err) {
        log.error('error', err);
        errors.push(err);
      }
    });
  });

  q.drain = function() {
    if (errors.length) {
      console.log();
      log.error('error', errors.join(', '));
    } else {
      callback(null, downloaded);
    }
  };
}

/* Install a package.
 *
 * The process of the installation:
 *
 *  1. Find and download the package from yuan or cache
 *  2. Copy the files to `sea-modules/{name}/{version}/{file}
 */
function spmInstall(data, callback, saveDeps) {
  var pkgId;
  if (data.version) {
    pkgId = data.name + '@' + data.version;
    var dest = path.join(config.dest, data.name, data.version);
    if (!config.force && file.exists(dest)) {
      log.info('found', pkgId);
      downloaded[pkgId] = data;
      callback(null, data);
      return;
    }
  } else {
    pkgId = data.name + '@stable';
  }

  if (pkgId in downloaded) {
    // The package is downloaded already
    log.debug('ignore', pkgId);
    callback(null, downloaded[pkgId]);
    return;
  }

  async.waterfall([
    function(callback) {
      log.info('install', color.magenta(pkgId));
      callback(null, pkgId);
    },
    fetch,
    copy
  ], function(err, pkg) {
    if (err) {
      callback(err);
      return;
    }

    // save dependencies to package.json
    if (saveDeps) {
      save(pkg.name, pkg.version);
    }

    var src = pkg.src;
    var packages = parseDependencies(path.join(src, 'package.json'));
    if (packages.length) {
      log.info('depends', packages.join(', '));
    }

    var id = pkg.name + '@' + pkg.version;
    downloaded[id] = pkg;

    if (file.exists(src)) {
      file.rmdir(src, {force: true});
    }

    if (packages.length) {
      queueInstall(packages, function(err) {
        callback(err, pkg);
      }, false);
    } else {
      callback(err, pkg);
    }
  });
}

/* Fetch and download the package
 *
 * The main fetch process:
 *
 *  1. Query information from yuan
 *  2. If the package is in cache and md5 matches, extract the cached tarball
 *  3. If not, fetch from yuan and extract it
 */
function fetch(query, callback) {
  log.info('fetch', query);
  var data = iduri.resolve(query);
  yuan(config).info(data, function(err, res, body) {
    if (err) {
      // when yuan is not available
      return callback(err);
    }
    var filename;
    if(body.filename) {
      filename = body.filename;
    } else {
      filename = body.name + '-' + body.version + '.tar.gz';
    }

    var dest = path.join(config.dest, body.name, body.version);
    var cacheDest = path.join(config.cache, filename);

    if (!config.force && file.exists(dest)) {
      var pkgId = body.name + '@' + body.version;
      log.info('found', pkgId);
    } else if (!config.force && file.exists(cacheDest) && md5file(cacheDest) === body.md5) {
      extract(cacheDest, callback);
    } else {
      fetchTarball('repository/' + body.name + '/' + body.version + '/' + filename, dest, callback);
    }
  });
}

function fetchTarball(urlpath, dest, callback) {
  file.mkdir(path.dirname(dest));
  log.info('download', urlpath);

  var data = {urlpath: urlpath, method: 'GET', encoding: null};
  yuan(config).request(data, function(err, res, body) {
    fs.writeFile(dest, body, function(err) {
      if (err) {
        callback(err);
      } else {
        log.info('save', dest);
        extract(dest, callback);
      }
    });
  });
}

function copy(src, callback) {
  var pkg = file.readJSON(path.join(src, 'package.json'));
  var dest;

  // install to name/version/
  if (pkg.name && pkg.version) {
    dest = path.join(config.dest, pkg.name, pkg.version);
  } else {
    if (!pkg.name) {
      log.error('package', 'missing `name` in package.json');
    }
    if (!pkg.version) {
      log.error('package', 'missing `version` in package.json');
    }
    process.exit(1);
  }
  log.info('installed', color.green(dest));

  // copy package.json
  file.copy(
    path.join(src, 'package.json'), path.join(dest, 'package.json')
  );

  // fix windows path
  file.recurse(src, function(fpath) {
    var fname = path.relative(src, fpath);
    file.copy(fpath, path.join(dest, fname));
  });

  pkg.src = src;
  callback(null, pkg);
}

function extract(src, callback) {
  var tmp = spmrc.get('user.temp');
  var random = parseInt(Math.random() * 1000000000, 10).toString();
  tmp = path.join(tmp, random, path.basename(src)).replace(/\.tar\.gz$/, '');
  if (file.exists(tmp)) {
    file.rmdir(tmp, {force: true});
  }
  log.info('extract', src);
  log.debug('extract', tmp);
  tar.extract(src, tmp, callback);
}

function parseDependencies(pkg, includeDev) {
  if (typeof pkg === 'string') {
    pkg = file.readJSON(pkg);
  }
  if (!pkg) {
    return [];
  }
  var deps = {};
  pkg.spm = pkg.spm || {};
  if (pkg.spm.dependencies) {
    deps = pkg.spm.dependencies;
  }
  if (includeDev && pkg.spm.devDependencies) {
    deps = _.extend(deps, pkg.spm.devDependencies);
  }
  if (includeDev && pkg.spm.engines) {
    deps = _.defaults(deps, pkg.spm.engines);
  }
  return mo.parseDependencies(deps);
}

function save(name, version) {
  if (!config.save && !config.saveDev) {
    return;
  }

  var package;
  if (!fs.existsSync('package.json')) {
    log.error('missing', 'package.json');
    return;
  } else {
    package = file.readJSON('package.json');
    package.spm = package.spm || {};
  }

  if (config.save) {
    log.info('deps saved', name + '@' + version);
    package.spm.dependencies = package.spm.dependencies || {};
    package.spm.dependencies[name] = version;
  }
  if (config.saveDev) {
    log.info('devDeps saved', name + '@' + version);
    package.spm.devDependencies = package.spm.devDependencies || {};
    package.spm.devDependencies[name] = version;
  }
  file.writeJSON('package.json', package);
}
