/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');
var urllib = require('url');


exports.resolve = function(uri) {
  // resolve uri to meta info
  //
  // Thanks to bower:
  // - https://github.com/twitter/bower/blob/master/lib/core/package.js
  var url, root, name, version, type, bits;
  if (/^(.*\.git)$/.exec(uri)) {
    url = RegExp.$1.replace(/^git\+/, '');
    type = 'git';
  } else if (/^(.*\.git)#(.*)$/.exec(uri)) {
    url = RegExp.$1.replace(/^git\+/, '');
    version = RegExp.$2;
    type = 'git';
  } else if (/^(?:(git):|git\+(https?):)\/\/([^#]+)#?(.*)$/.exec(uri)) {
    url = (RegExp.$1 || RegExp.$2) + '://' + RegExp.$3;
    version = RegExp.$4;
    type = 'git';
  } else if (/^https?:\/\//.exec(uri)) {
    url = uri;
    version = false;
    type = 'http';
  } else if (/^(?:(git:\/\/)|(git@))([^#]+)#?(.*)$/.exec(uri)) {
    url = (RegExp.$1 || RegExp.$2) + RegExp.$3;
    version = RegExp.$4;
    type = 'git';
  } else if (uri.split('/').length === 2) {
    if (uri.indexOf('#') !== -1) {
      bits = uri.split('#', 2);
    } else {
      bits = uri.split('@', 2);
    }
    url = 'git://github.com/' + bits[0] + '.git';
    version = bits[1];
    type = 'git';
  } else {
    if (uri.indexOf('#') !== -1) {
      bits = uri.split('#', 2);
    } else {
      bits = uri.split('@', 2);
    }
    url = bits[0];
    version = bits[1];
    type = 'spm';
  }

  // spm type is:
  // root.name@version
  // root.name#version
  if (type === 'spm') {
    bits = url.split('.', 2);
    root = bits[0];
    if (bits.length === 1) {
      name = bits[0];
    } else {
      name = bits[1];
    }
    url = false;
  } else if (type === 'git') {
    if (/^git@.*?:(\w+)\/([a-z0-9\-]+)(?:\.git)?/.exec(url)) {
      root = RegExp.$1;
      name = RegExp.$2.replace(/\.git$/, '');
    } else if (/.*?\/(\w+)\/([a-z0-9\-]+)(\.git)?/.exec(url)) {
      root = RegExp.$1;
      name = RegExp.$2.replace(/\.git$/, '');
    }
  }
  return {type: type, root: root, name: name, version: version, url: url};
};

exports.download = function(uri, spmServer, callback) {
  if (!callback) {
    callback = spmServer;
    // default spm server
    spmServer = 'http://registry.spmjs.org';
  }

  var meta = exports.resolve(uri);
  if (meta.type === 'http') {
    httpFetch(meta, callback);
  } else if (meta.type === 'git') {
    gitFetch(meta, callback);
  } else if (meta.type === 'spm') {
    spmFetch(meta, spmServer, callback);
  }
};

function httpFetch(meta, callback) {
  var options = urllib.parse(meta.url);
  var connect = require(options.protocol.slice(0, -1));
  connect.get(options, function(res) {
    if (res.statusCode !== 200) {
      throw 'http fetch failed ' + res.statusCode;
    }
    var ret = [], length = 0;
    res.on('data', function(chunk) {
      length += chunk.length;
      ret.push(chunk);
    });
    if (callback) {
      res.on('end', function() {
        var buf = new Buffer(length), index = 0;

        ret.forEach(function(chunk) {
          chunk.copy(buf, index, 0, chunk.length);
          index += chunk.length;
        });
        callback(meta, buf);
      });
    }
  });
}

function gitFetch(meta, callback) {
}

function spmFetch(meta, spmServer, callback) {
  // TODO, waiting for spmjs.org
}
