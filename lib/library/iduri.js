var path = require('path');


exports.normalize = function(uri) {
  // ## normalie uri
  //
  // make sure the uri to be pretty,
  // for example a//b/../c should be a/c.
  uri = path.normalize(uri);
  uri = uri.replace(/\\/g, '/');
  var lastChar = uri.charAt(uri.length - 1);
  if (lastChar === '/') return uri;
  // if it ends with #, we should return the uri without #
  if (lastChar === '#') return uri.slice(0, -1);
  // TODO ext logical
  return uri;
};

exports.relative = function(base, uri) {
  // # relative uri
  //
  // this is very different from node's path.relative.
  //
  // if uri starts with /, it's absolute uri, we don't relative it.
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

exports.join = function() {
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

exports.id2uri = function() {
};

exports.generateId = function(obj) {
  obj = obj || {};
  var format = obj.format || '{{root}}/{{name}}/{{version}}/{{filename}}';
  var regex = /\{\{(.*?)\}\}/;
  var match = regex.exec(format);
  while (match) {
    var key = match[0];
    var value = obj[match[1]];
    if (match[1] === 'filename') value = cleanName(value);
    format = format.replace(key, value);
    match = regex.exec(format);
  }
  return format;
};

function cleanName(name) {
  if (name.indexOf('/') !== -1) {
    throw 'name is invalid';
  }
  var ext = exports.extname(name);
  if (ext === '.js') {
    name = name.slice(0, -3);
  }
  return name;
}
