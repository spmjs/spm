var path = require('path');


exports.normalize = function(uri) {
  uri = path.normalize(uri);
  uri = uri.replace(/\\/g, '/');
  var lastChar = uri.charAt(uri.length - 1);
  if (lastChar === '/') return uri;
  if (lastChar === '#') return uri.slice(0, -1);
  // TODO ext logical
  return uri;
};

exports.resolve = function(base, uri) {
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
  return ext ? ext: '.js';
};

exports.id2uri = function() {
};
