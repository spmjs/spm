/* install package from spmjs.org */

var fs = require('fs');
var path = require('path');
var util = require('util');
var request = require('request');
var async = require('async');
var md5file = require('./utils').md5file;
var tar = require('./utils/tar');
var log = require('./utils/log');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var grunt = require('./sdk/grunt');
var _module = require('./sdk/module');
var spmrc = require('./sdk/spmrc');


exports.run = function(options) {
  var name = options.args[0];
  var dest = options.args[1] || 'sea-modules';
  var server;
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.source');
  }
  server = server || 'https://spmjs.org';

  var parsed = iduri.resolve(name);
  if (parsed.type === 'spm') {
    login(server, options, function(error, auth) {
      parsed.server = server;
      parsed.auth = auth;
      install(parsed, dest, function() {
      });
    });
  }
};

function login(server, options, callback) {
  var data, section, auth;
  if (options.username && options.password) {
    data = {account: options.username, password: options.password, server: server};
    yuan(data).login(function(error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body.data);
      }
    });
  } else {
    if (options.source) {
      section = 'source.' + options.source + '.auth';
    } else {
      section = 'user.auth';
    }
    auth = spmrc.config(section);
    callback(null, auth);
  }
}

var _cache = [];
function install(data, dest, callback) {
  fetchAndExtract(data, function(err, src) {
    if (err) {
      callback(err);
      return;
    }
    distribute(src, dest);

    var q = async.queue(function(task, callback) {
      if (grunt.util._.contains(_cache, task)) {
        log.debug('ignore', 'package %s already in queue', task);
      } else {
        _cache.push(task);
        var parsed = iduri.resolve(task);
        parsed.server = data.server;
        parsed.auth = data.auth;
        fetchAndExtract(parsed, function(err, src) {
          if (err) {
            callback(err);
          } else {
            distribute(src, dest);
            callback(null, dest);
          }
        });
      }
    }, 4);
    q.drain = function() {
      callback();
    };
    var deps = _module.distDependencies(path.join(src, 'dist'));
    Object.keys(deps).forEach(function(key) {
      deps[key].forEach(function(v) {
        q.push(key + '@' + v, function(err) {
          if (err) log.error('error', util.format('%s@%s %s', key, v, err));
        });
      });
    });
  });
}

function distribute(src, dest) {
  dest = dest || 'sea-modules';
  var pkg = grunt.file.readJSON(path.join(src, 'package.json'));
  if (pkg.family === pkg.name) {
    dest = path.join(dest, pkg.name, pkg.version);
  } else {
    dest = path.join(dest, pkg.family, pkg.name, pkg.version);
  }
  var dist = path.join(src, 'dist');
  grunt.file.recurse(dist, function(fpath) {
    var fname = fpath.replace(dist, '').replace(/^\//, '');
    grunt.file.copy(fpath, path.join(dest, fname));
  });
}

function fetchAndExtract(data, callback) {
  async.waterfall([
    function(callback) {
      yuan(data).info(callback);
    },
    function(body, callback) {
      var data = body.data;
      var dest = path.join(process.env.HOME, '.spm', 'download', data.download_url);
      if (grunt.file.exists(dest) && md5file(dest) === data.md5) {
        callback(null, dest);
      } else {
        // TODO: mirror
        httpDownload(data.download, dest, callback);
      }
    },
    function(src, callback) {
      var tmp = path.join(process.env.TMPDIR, path.basename(src));
      tmp = tmp.replace(/\.tar\.gz$/, '');
      if (grunt.file.exists(tmp)) {
        grunt.file.delete(tmp, {force: true});
      }
      tar.extract(src, tmp, function(err, target) {
        target = path.join(target, 'package');
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
  ], function(err, result) {
    callback(err, result);
  });
}

function httpDownload(url, dest, callback) {
  log.info('download', url);
  grunt.file.mkdir(path.dirname(dest));
  request(url).pipe(fs.createWriteStream(dest).on('close', function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, dest);
    }
  }));
}
