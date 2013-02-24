/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var color = require('colorful').color;
var md5file = require('./utils').md5file;
var tar = require('./utils/tar');
var log = require('./utils/log');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var grunt = require('./sdk/grunt');
var _module = require('./sdk/module');
var spmrc = require('./sdk/spmrc');
var _cache = {};
var _options = {};

module.exports = function(options) {
  var server;
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.source');
  }
  options.server = server || 'https://spmjs.org';

  _options = options;
  _options.dest = options.args[1] || 'sea-modules';
  if (options.parallel) {
    _options.parallel = 4;
  } else {
    _options.parallel = 1;
  }

  var repo = options.args[0];
  var packages = repo ? [repo] : parseDependencies('package.json');

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

  data.server = _options.server;

  _cache[pkg] = _cache[pkg] || [];

  async.waterfall([
    function(callback) {
      console.log();
      log.info('install', color.magenta(pkg));
      yuan(data).info(callback);
    },
    function(res, body, callback) {
      var data = body.data;
      var dest = path.join(process.env.HOME, '.spm', 'download', data.download_url);
      if (!_options.force && grunt.file.exists(dest) && md5file(dest) === data.md5) {
        callback(null, dest);
      } else {
        var mirror = spmrc.get('user.mirror');
        if (mirror) {
          data.download = data.download.replace(
            data.download_base.replace(/\/$/, ''),
            mirror.replace(/\/$/, '')
          );
        }
        httpDownload(data.download, dest, callback);
      }
    }, extract
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
      // copy dist to sea modules
      var dest = _options.dest;
      var pkg = grunt.file.readJSON(path.join(target, 'package.json'));
      dest = path.join(dest, pkg.family, pkg.name, pkg.version);
      // fix windows path
      var dist = path.join(target, 'dist').replace(/\\/g, '/');
      log.info('distribute', dest);
      grunt.file.recurse(dist, function(fpath) {
        var fname = fpath.replace(dist, '').replace(/^\//, '');
        grunt.file.copy(fpath, path.join(dest, fname));
      });
      callback(null, target);
    }
  });
}

function httpDownload(url, dest, callback) {
  grunt.file.mkdir(path.dirname(dest));
  log.info('download', url);
  // TODO: debug for fatal error
  request(url).pipe(fs.createWriteStream(dest).on('close', function(err) {
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
