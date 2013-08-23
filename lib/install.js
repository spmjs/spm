/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var async = require('async');
var color = require('colorful');
var semver = require('semver');
var ast = require('cmd-util').ast;
var _ = require('lodash');
var spmrc = require('spmrc');
var md5file = require('./utils').md5file;
var childexec = require('./utils').childexec;
var tar = require('./utils/tar');
var log = require('./utils/log');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var file = require('./sdk/file');
var mo = require('./sdk/module');
var git = require('./sdk/git');

var downloaded = {};

var homedir = spmrc.get('user.home');

var config = {
  dest: spmrc.get('install.path'),
  cache: path.join(homedir, '.spm', 'cache'),
  srcCache: path.join(homedir, '.spm', 'src'),
  parallel: 1
};

exports = module.exports = function(options, callback) {
  callback = callback || function() {};
  config.parallel = options.parallel || config.parallel;
  config.dest = options.destination || config.dest;
  config.source = options.source;
  config.force = options.force;

  var packages;

  var query = options.query;
  if (query.length && query[0].charAt(0) !== '.') {
    packages = options.query;
  } else {
    packages = parseDependencies('package.json', true);
  }

  var cb = callback;
  if (query.length && query[0] === '.') {
    cb = function(err) {
      if (err) {
        throw new Error(err);
      }
      copy('.', callback);
    }
  }

  if (!packages.length) {
    cb(null);
    return;
  }

  queueInstall(packages, cb);
};
exports.config = config;

function queueInstall(tasks, callback) {
  var errors = [];
  var q = async.queue(function(task, callback) {
    if (typeof task === 'string') {
      task = iduri.resolve(task);
    }
    spmInstall(task, callback);
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
      callback(errors.join(' '));
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
 *  2. Detect if the package need to build
 *  3. Copy the files is `dist` to `sea-modules/{family}/{name}/{version}/{file}
 */
function spmInstall(data, callback) {
  var pkg = data.family + '/' + data.name;
  if (data.version) {
    pkg = pkg + '@' + data.version;
    var dest = path.join(config.dest, data.family, data.name, data.version);
    if (!config.force && file.exists(dest)) {
      console.log();
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
      // quiet mode, don't show blank line
      log.log('info', '');
      log.info('install', color.magenta(pkg));
      callback(null, pkg);
    },
    fetch, build, copy
  ], function(err, result) {
    if (err) {
      callback(err);
      return;
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
      queueInstall(packages, callback);
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
      log.warn('yuan', err);
      fetchCache(data, function(err, result) {
        if (err) {
          log.warn('warn', err);
          fetchGit(data, callback);
        } else {
          callback(null, result);
        }
      });
      return;
    }
    if (body.filename) {
      var filepath = path.join(
        body.family, body.name, body.version, body.filename
      );
      var dest = path.join(config.cache, filepath);
      if (file.exists(dest) && md5file(dest) === body.md5) {
        extract(dest, callback);
      } else {
        var urlpath = 'repository/' + filepath.replace(/\\/g, '/');
        fetchTarball(urlpath, dest, callback);
      }
    } else {
      fetchGit(body, callback);
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

function fetchCache(data, callback) {
  var fpath = path.join(config.cache, data.family, data.name);
  if (!fs.existsSync(fpath))  {
    callback('not in cache');
    return;
  }
  log.info('found', fpath);
  if (!data.version) {
    var versions = fs.readdirSync(fpath).filter(semver.valid);
    versions = versions.sort(semver.compare).reverse();
    data.version = versions[0];
  }
  var filename = data.name + '-' + data.version + '.tar.gz';
  fpath = path.join(fpath, data.version, filename);
  if (fs.existsSync(fpath)) {
    extract(fpath, callback);
  } else {
    callback('not in cache');
  }
}

function fetchGit(pkg, callback) {
  var dest = path.join(config.srcCache, pkg.family, pkg.name);
  var revision = pkg.revision || pkg.version || pkg.tag || 'HEAD';
  log.debug('revision', revision);
  if (fs.existsSync(dest)) {
    git.checkout('master', {cwd: dest}, function(err) {
      if (err) {
        callback(err);
        return;
      }
      git.pull({cwd: dest}, function(err) {
        err && log.warn('git', err);
        git.checkout(revision, {cwd: dest}, function(err) {
          err && log.warn('git', err);
          callback(null, dest);
        });
      });
    });
    return;
  }
  var repo = pkg.repository;
  if (repo && _.isObject(repo)) {
    repo = repo.url;
  }
  if (!repo) {
    callback('not found');
    return;
  }
  log.info('clone', repo);
  git.clone(repo, dest, function(err) {
    if (err) {
      callback(err);
      return;
    }
    git.checkout(revision, {cwd: dest}, function(err) {
      err && log.warn('git', err);
      callback(null, dest);
    });
  });
}

function build(src, callback) {
  if (fs.existsSync(path.join(src, 'dist'))) {
    log.info('found', 'dist in the package');
    callback(null, src);
    return;
  }
  childexec('spm build', {cwd: src}, function(err) {
    if (err) {
      callback(err);
      return;
    }
    callback(null, src);
  });
}

function copy(src, callback) {
  var pkg = file.readJSON(path.join(src, 'package.json'));
  var dest;
  var format = spmrc.get('install.format');
  if (format && /\{\{\s*filename\s*\}\}$/.test(format) && !iduri.validateFormat(format)) {
    dest = path.join(config.dest, iduri.idFromPackage(pkg, '', format));
  } else if (pkg.family && pkg.name && pkg.version) {
    dest = path.join(config.dest, pkg.family, pkg.name, pkg.version);
    format = null;
  } else {
    if (!pkg.family) {
      log.error('package', 'missing `family` in package.json');
    }
    if (!pkg.name) {
      log.error('package', 'missing `name` in package.json');
    }
    if (!pkg.version) {
      log.error('package', 'missing `version` in package.json');
    }
    process.exit(1);
  }
  var nodebug = spmrc.get('install.debugfile') === 'false';
  if (nodebug) {
    log.info('ignore', 'will not install debug file');
  }
  log.info('installed', dest);

  // copy package.json
  file.copy(
    path.join(src, 'package.json'), path.join(dest, 'package.json')
  );

  // fix windows path
  var dist = path.join(src, 'dist').replace(/\\/g, '/');
  file.recurse(dist, function(fpath) {
    if (nodebug && /-debug\.\w{1,6}$/.test(fpath)) {
      return;
    }
    var fname = fpath.replace(dist, '').replace(/^\//, '');
    if (format && /\.js$/.test(fpath)) {
      var code = transform({
        code: file.read(fpath),
        filename: fname,
        pkg: pkg,
        format: format
      });
      file.write(path.join(dest, fname), code);
    } else {
      file.copy(fpath, path.join(dest, fname));
    }
  });
  callback(null, src);
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

function transform(obj) {
  log.debug('transform', obj.filename);
  var repl = function(id) {
    var m = mo.parseIdentify(id);
    if (!m) return id;
    return iduri.idFromPackage(m, obj.filename, obj.format);
  };
  var uglifyOptions = {comments: true};
  if (~obj.filename.indexOf('debug')) {
    uglifyOptions.beautify = true;
  }
  return ast.modify(obj.code, repl).print_to_string(uglifyOptions);
}

function parseDependencies(pkg, includeDev) {
  if (typeof pkg === 'string') {
    pkg = file.readJSON(pkg);
  }
  if (!pkg) {
    return [];
  }
  var alias = {};
  pkg.spm = pkg.spm || {};
  if (pkg.spm.alias) {
    alias = pkg.spm.alias;
  }
  if (includeDev && pkg.spm.devAlias) {
    alias = _.extend(alias, pkg.spm.devAlias);
  }
  if (includeDev && pkg.spm.engines) {
    alias = _.defaults(alias, pkg.spm.engines);
  }
  return mo.parseAlias(alias);
}
