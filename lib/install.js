/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var color = require('colorful').color;
var ast = require('cmd-util').ast;
var md5file = require('./utils').md5file;
var tar = require('./utils/tar');
var log = require('./utils/log');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var grunt = require('./sdk/grunt');
var _module = require('./sdk/module');
var spmrc = require('./sdk/spmrc');

var _cache = {};
var _options = {
  dest: 'sea-modules',
  cache: path.join(process.env.HOME, '.spm', 'cache'),
  parallel: 1
};

module.exports = function(options) {
  _options.parallel = options.parallel || _options.parallel;
  _options.dest = options.destination || _options.dest;
  _options.source = options.source;
  _options.force = options.force;

  var packages;
  if (options.query && options.query.charAt(0) !== '.') {
    packages = [options.query];
  } else {
    packages = parseDependencies('package.json');
  }

  queueInstall(packages, function() {
     console.log();
  });
};

function queueInstall(tasks, callback) {
  var q = async.queue(function(task, callback) {
    if (typeof task === 'string') {
      task = iduri.resolve(task);
    }
    if (task.type === 'spm') {
      spmInstall(task, callback);
    }
    // TODO other types
  }, _options.parallel);

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
  }
  if (grunt.util._.contains(Object.keys(_cache), pkg)) {
    log.debug('ignore', pkg);
    callback(null);
    return;
  }

  _cache[pkg] = _cache[pkg] || [];

  async.waterfall([
    function(callback) {
      console.log();
      log.info('install', color.magenta(pkg));
      yuan(_options).info(data, callback);
    },
    function(res, body, callback) {
      var filepath = path.join(
        body.family, body.name, body.version, body.filename
      );
      var dest = path.join(_options.cache, filepath);
      if (!_options.force && grunt.file.exists(dest) && md5file(dest) === body.md5) {
        callback(null, dest);
      } else {
        var urlpath = 'repository/' + filepath.replace(/\\/g, '/');
        httpDownload(urlpath, dest, callback);
      }
    },
    extract, distribute
  ], function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    var packages = parseDependencies(path.join(result, 'package.json'));
    if (packages.length) {
      log.info('depends', packages.join(', '));
    }
    _cache[pkg] = grunt.util._.union(_cache[pkg], packages);

    if (packages.length) {
      queueInstall(packages, callback);
    } else {
      callback(err, result);
    }
  });
}

function extract(src, callback) {
  var tmp = process.env.TMPDIR || process.env.TEMP || process.env.TMP;
  tmp = path.join(tmp, path.basename(src)).replace(/\.tar\.gz$/, '');
  if (grunt.file.exists(tmp)) {
    grunt.file.delete(tmp, {force: true});
  }
  log.debug('extract', tmp);
  tar.extract(src, tmp, function(err, target) {
    log.info('verify', 'package.json and dist directory');
    if (err) {
      callback(err);
    } else if (!grunt.file.exists(path.join(target, 'package.json'))) {
      callback('package.json is missing.');
    } else if (!grunt.file.exists(path.join(target, 'dist'))) {
      callback('dist directory is missing.');
    } else {
      callback(null, target);
    }
  });
}

function distribute(src, callback) {
  var pkg = grunt.file.readJSON(path.join(src, 'package.json'));
  var dest;
  var format = spmrc.get('install.format');
  var regex = /^\{\{\s*family\s*\}\}\/\{\{\s*name\s*\}\}\/\{\{\s*version\s*\}\}\/\{\{\s*filename\s*\}\}$/;
  if (format && /\{\{\s*filename\s*\}\}$/.test(format) && !regex.test(format)) {
    dest = path.join(_options.dest, iduri.idFromPackage(pkg, '', format));
  } else {
    dest = path.join(_options.dest, pkg.family, pkg.name, pkg.version);
    format = null;
  }
  log.info('distribute', dest);

  // fix windows path
  var dist = path.join(src, 'dist').replace(/\\/g, '/');
  grunt.file.recurse(dist, function(fpath) {
    var fname = fpath.replace(dist, '').replace(/^\//, '');
    if (format && /\.js$/.test(fpath)) {
      var code = transform({
        code: grunt.file.read(fpath),
        filename: fname,
        pkg: pkg,
        format: format
      });
      grunt.file.write(path.join(dest, fname), code);
    } else {
      grunt.file.copy(fpath, path.join(dest, fname));
    }
  });
  callback(null, src);
}

function transform(obj) {
  log.debug('transform', obj.filename);
  var repl = function(id) {
    var m = _module.parseIdentify(id);
    if (!m) return id;
    return iduri.idFromPackage(m, obj.filename, obj.format);
  };
  var uglifyOptions = {comments: true};
  if (~obj.filename.indexOf('debug')) {
    uglifyOptions.beautify = true;
  }
  return ast.modify(obj.code, {
    id: repl,
    dependencies: repl,
    require: repl,
    options: uglifyOptions
  });
}

function httpDownload(urlpath, dest, callback) {
  grunt.file.mkdir(path.dirname(dest));
  log.info('download', urlpath);
  var data = {urlpath: urlpath, method: 'GET'};
  yuan(_options).request(data).pipe(fs.createWriteStream(dest).on('close', function(err) {
    if (err) {
      callback(err);
    } else {
      log.info('save', dest.replace(process.env.HOME, '~'));
      callback(null, dest);
    }
  }));
}

function parseDependencies(pkg) {
  if (typeof pkg === 'string') {
    pkg = grunt.file.readJSON(pkg);
  }
  var alias = (pkg.spm && pkg.spm.alias) || {};
  var deps = Object.keys(alias).map(function(key) {
    return alias[key];
  });
  return _module.plainDependencies(_module.parseDependencies(deps));
}
