/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var format = require('util').format;
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

var _cache = {};

var homedir = spmrc.get('user.home');
var store = {
  dest: spmrc.get('install.path'),
  cache: path.join(homedir, '.spm', 'cache'),
  srcCache: path.join(homedir, '.spm', 'src'),
  parallel: 1
};

exports = module.exports = function(options, callback) {
  callback = callback || function() {};
  store.parallel = options.parallel || store.parallel;
  store.dest = options.destination || store.dest;
  store.source = options.source;
  store.force = options.force;

  var packages;
  if (options.query.length && options.query[0].charAt(0) !== '.') {
    packages = options.query;
  } else {
    packages = parseDependencies('package.json', true);
  }

  if (!packages.length) {
    callback(null);
    return;
  }

  queueInstall(packages, callback);
};

function queueInstall(tasks, callback) {
  var q = async.queue(function(task, callback) {
    if (typeof task === 'string') {
      task = iduri.resolve(task);
    }
    spmInstall(task, callback);
  }, store.parallel);

  tasks.forEach(function(task) {
    q.push(task, function(err) {
      err && log.error('error', err);
    });
  });

  q.drain = callback;
}

function spmInstall(data, callback) {
  var pkg = data.family + '/' + data.name;
  if (data.version) {
    pkg = pkg + '@' + data.version;
    var dest = path.join(store.dest, data.family, data.name, data.version);
    if (!store.force && file.exists(dest)) {
      console.log();
      log.info('found', pkg);
      callback(null);
      return;
    }
  }
  if (_.contains(Object.keys(_cache), pkg)) {
    log.debug('ignore', pkg);
    callback(null);
    return;
  }

  _cache[pkg] = _cache[pkg] || [];

  async.waterfall([
    function(callback) {
      console.log();
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
    _cache[pkg] = _.union(_cache[pkg], packages);

    if (packages.length) {
      queueInstall(packages, callback);
    } else {
      callback(err, result);
    }
  });
}

exports.fetch = fetch;

function fetch(query, callback) {
  log.info('fetch', query);
  var data = iduri.resolve(query);
  yuan(store).info(data, function(err, res, body) {
    if (err) {
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
      var dest = path.join(store.cache, filepath);
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
  yuan(store).request(data, function(err, res, body) {
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
  var fpath = path.join(store.cache, data.family, data.name);
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
  var dest = path.join(store.srcCache, pkg.family, pkg.name);
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
    repo = format('git://github.com/%s/%s.git', pkg.family, pkg.name);
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
    dest = path.join(store.dest, iduri.idFromPackage(pkg, '', format));
  } else if (pkg.family && pkg.name && pkg.version) {
    dest = path.join(store.dest, pkg.family, pkg.name, pkg.version);
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
  tmp = path.join(tmp, path.basename(src)).replace(/\.tar\.gz$/, '');
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
