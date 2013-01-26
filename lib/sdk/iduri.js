/*
 * spm.sdk.iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var path = require('path');
var logging = require('colorful').logging;
var template = require('grunt').template;

// resolve uri to meta info
// https://github.com/twitter/bower/blob/master/lib/core/package.js
exports.resolve = function(uri) {
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
  // root/name@version
  // root/name#version
  // root.name@version
  // root.name#version
  if (type === 'spm') {
    bits = url.split('.', 2);
    if (bits.length === 1) {
      bits = url.split('/', 2);
    }
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


// normalie uri
// make sure the uri to be pretty,
// for example a//b/../c should be a/c.
exports.normalize = function(uri) {
  uri = path.normalize(uri);
  uri = uri.replace(/\\/g, '/');
  var lastChar = uri.charAt(uri.length - 1);
  if (lastChar === '/') return uri;
  // if it ends with #, we should return the uri without #
  if (lastChar === '#') return uri.slice(0, -1);
  // TODO ext logical
  return uri;
};


// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
exports.relative = function(base, uri) {
  if (uri.charAt(0) === '/') return uri;

  var bits = _.filter(base.split('/'), function(o) { return o; });
  var dots = [];
  if (bits.length > 1) {
    _(bits.length - 1).times(function() {
      dots.push('..');
    });
    return dots.join('/') + '/' + uri;
  }
  return uri;
};


// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function(base, uri) {
  if (uri.charAt(0) !== '.') return uri;
  uri = path.join(path.dirname(base), uri);
  return exports.normalize(uri);
};


exports.join = function(base, uri) {
  return path.join(base, uri).replace(/\\/g, '/');
};


exports.dirname = function(uri) {
  uri = path.dirname(uri);
  return uri.replace(/\\/g, '/');
};


exports.basename = function(uri) {
  var basename = path.basename(uri);
  return basename.replace(/\\/g, '/');
};


exports.extname = function(uri) {
  var ext = path.extname(uri);
  // default ext is js
  return ext ? ext: '.js';
};


exports.appendext = function(uri) {
  var ext = path.extname(uri);
  if (!ext) return uri + '.js';
  return uri;
};


exports.alias2id = function(pkg, name) {
  // relative name: ./class
  if (name.charAt(0) === '.') {
    return name.replace(/\.js$/, '');
  }

  var alias = {};
  if (pkg.spm && pkg.spm.alias) {
    alias = pkg.spm.alias;
  }
  if (alias.hasOwnProperty(name)) {
    return alias[name];
  }
  if (pkg.alias && pkg.alias.hasOwnProperty(name)) {
    return pkg.alias[name];
  }
  logging.warn("can't resolve alias: %s", name);
  return name;
};


exports.pkg2id = function(pkg, filename, format) {
  if (filename && !format && filename.indexOf('<%=') !== -1) {
    format = filename;
    filename = null;
  }
  if (!filename) {
    filename = pkg.filename;
  }
  if (filename.charAt(0) === '.') {
    return filename.replace(/\.js$/, '');
  }
  if (pkg.spm && pkg.spm.format) {
    format = format || pkg.spm.format;
  }
  format = format || '<%= root %>/<%= name %>/<%= version %>/<%= filename %>';
  var data = pkg;
  data.filename = filename.replace(/\.js$/, '');
  return template.process(format, {data: data});
};


// if id is valid.
// options: {strict: false}
exports.validate = function(id, options) {
  options = options || {};
  if (~id.indexOf('//')) {
    logging.error('Invalid id:', id);
    return false;
  }
  var regex = /^(?:[a-z][a-z0-9\-]*\/)?[a-z][a-z0-9\-]*\/\d+\.\d+\.\d+\/[a-z0-9\-\/]+$/;
  if (regex.test(id)) {
    return true;
  }
  if (options.hasOwnProperty('strict') && options.strict) {
    logging.error('Invalid CMD id:', id);
  } else {
    logging.warn('Invalid CMD id:', id);
  }
  return false;
};
