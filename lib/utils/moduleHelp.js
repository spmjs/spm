var path = require('path');
var url = require('url');

exports.isJs = function(filepath) {
  return path.extname(filepath) === '.js';
};

exports.isRelative = function(id) {
  return id.indexOf('./') === 0 ||
         id.indexOf('../') === 0 || 
         path.extname(id) === '.js';
};

// 规整内部依赖模块
// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
exports.normalize = function(module) {
  module = path.normalize(module);
  if (path.extname(module) !== '.js') {
    module += '.js';
  }
  return module;
};

exports.unique = function(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
};

exports.getHost = function(requestUrl) {
  if (requestUrl.indexOf('http') < 0) {
    requestUrl = 'http://' + requestUrl;
  }
  return url.parse(requestUrl).host;
};


