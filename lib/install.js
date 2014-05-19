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

var config = {
  dest: spmrc.get('install.path'),
  cache: path.join(homedir, '.spm', 'cache'),
  parallel: 1
};

exports = module.exports = function(options, callback) {
  console.log();

  downloaded = {};
  callback = callback || function() {};
  options = options || {};
  config.parallel = options.parallel || config.parallel;
  config.dest = options.destination || config.dest;
  config.source = options.source;
  config.cache = options.cache || config.cache;
  config.server = options.server;
  config.force = options.force;
  config.save = options.save;
  config.saveDev = options.saveDev;

  var packages;

  var query = options.query;
  if (query && query.length && query[0].charAt(0) !== '.') {
    packages = options.query;
  } else {
    packages = parseDependencies('package.json', true);
  }

  var cb = callback;
  if (query && query.length && query[0] === '.') {
    cb = function(err) {
      if (err) {
        throw new Error(err);
      }
      copy('.', callback);
    };
  }

  if (!packages.length) {
    cb(null);
    return;
  }

  queueInstall(packages, cb, true);
};
exports.config = config;

function queueInstall(tasks, callback, saveDeps) {
  var errors = [];
  var q = async.queue(function(task, callback) {
    if (typeof task === 'string') {
      task = iduri.resolve(task);
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
      callback();
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
  var pkg = data.name;
  if (data.version) {
    pkg = pkg + '@' + data.version;
    var dest = path.join(config.dest, data.name, data.version);
    if (!config.force && file.exists(dest)) {
      log.info('found', pkg);
      callback(null);
      return;
    }
  } else {
    pkg = pkg + '@stable';
  }
  if (_.contains(Object.keys(downloaded), pkg)) {
    // The package is downloaded already
    log.debug('ignore', pkg);
    callback(null);
    return;
  }

  downloaded[pkg] = downloaded[pkg] || [];

  async.waterfall([
    function(callback) {
      log.info('install', color.magenta(pkg));
      callback(null, pkg);
    },
    fetch, copy
  ], function(err, result, pkg) {
    if (err) {
      callback(err);
      return;
    }

    // save dependencies to package.json
    if (saveDeps) {
      save(pkg.name, pkg.version);
    }

    var packages = parseDependencies(path.join(result, 'package.json'));
    if (packages.length) {
      log.info('depends', packages.join(', '));
    }
    downloaded[pkg] = _.union(downloaded[pkg], packages);

    if (file.exists(result)) {
      file.rmdir(result, {force: true});
    }

    if (packages.length) {
      queueInstall(packages, callback, false);
    } else {
      callback(err, result);
    }
  });
}

exports.fetch = fetch;

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
      callback(err);
      return;
    }
    var filename;
    if(body.filename) {
      filename = body.filename;
    } else {
      filename = body.name + '-' + body.version + '.tar.gz';
    }
    var dest = path.join(config.cache, filename);
    if (file.exists(dest) && md5file(dest) === body.md5) {
      extract(dest, callback);
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

  callback(null, src, pkg);
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
