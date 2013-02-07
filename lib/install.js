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
var _options = {
  server: 'https://spmjs.org',
  force: false,
  dest: 'sea-modules'
};

exports.run = function(options) {
  var server;
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.source');
  }
  options.server = server || 'https://spmjs.org';

  _options = options;
  _options.dest = options.args[1] || 'sea-modules';

  var repo = options.args[0];
  var packages = repo ? [repo] : deps2packages(_module.srcDependencies('src'));

  yuan(options).login(function(err, res, body) {
    _options.auth = body.data;
    queueInstall(packages, function() {
      console.log();
    });
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
  }, 1);

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
  data.auth = _options.auth;

  _cache[pkg] = _cache[pkg] || [];

  async.waterfall([
    function(callback) {
      console.log();
      log.info('install', color.magenta(pkg));
      yuan(data).info(callback);
    },
    function(body, callback) {
      var data = body.data;
      var dest = path.join(process.env.HOME, '.spm', 'download', data.download_url);
      if (!_options.force && grunt.file.exists(dest) && md5file(dest) === data.md5) {
        callback(null, dest);
      } else {
        // TODO: mirror
        httpDownload(data.download, dest, callback);
      }
    }, extract
  ], function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    var deps = _module.distDependencies(path.join(result, 'dist'));
    var packages = deps2packages(deps);
    log.info('depends', packages.join(', '));
    _cache[pkg] = grunt.util._.union(_cache[pkg], packages);

    if (packages.length) {
      queueInstall(packages, callback);
    } else {
      callback(err, result);
    }
  });
}

function extract(src, callback) {
  var tmp = path.join(process.env.TMPDIR, path.basename(src));
  tmp = tmp.replace(/\.tar\.gz$/, '');
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
      if (pkg.family === pkg.name) {
        dest = path.join(dest, pkg.name, pkg.version);
      } else {
        dest = path.join(dest, pkg.family, pkg.name, pkg.version);
      }
      var dist = path.join(target, 'dist');
      log.info('distribute', dest);
      grunt.file.recurse(dist, function(fpath) {
        var fname = fpath.replace(dist, '').replace(/^\//, '');
        grunt.file.copy(fpath, path.join(dest, fname));
      });
      callback(null, target);
    }
  });
}

function deps2packages(deps) {
  var packages = [];
  Object.keys(deps).forEach(function(key) {
    deps[key].forEach(function(v) {
      packages.push(key + '@' + v);
    });
  });
  return packages;
}

function httpDownload(url, dest, callback) {
  grunt.file.mkdir(path.dirname(dest));
  log.info('download', url);
  request(url).pipe(fs.createWriteStream(dest).on('close', function(err) {
    if (err) {
      callback(err);
    } else {
      log.info('save', dest.replace(process.env.HOME, '~'));
      callback(null, dest);
    }
  }));
}
