var path = require('path');
var url = require('url');
var fsExt = require('./fs_ext.js');
var env = require('./env.js');

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
  if (!path.extname(module)) {
    module += '.js';
  }
  return env.normalizePath(module);
};

exports.unique = function(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
};

exports.isLocalPath = function(requestUrl) {
  if (requestUrl.indexOf('~') === 0) return true;
  if (requestUrl.indexOf('http') > -1) return false;
  if (fsExt.existsSync(requestUrl)) {
    return true;
  }
  return false;
};

exports.getHost = function(requestUrl) {
  if (requestUrl.indexOf('http') < 0) {
    requestUrl = 'http://' + requestUrl;
  }
  var h = url.parse(requestUrl).host;
  return h.replace(/:/, '-');
};

// 根据基于base的main模块路径，计算出他以来的dep模块相对于base的完整path路径.
exports.getBaseDepModulePath = function(main, dep) {
  if (main == dep) {
    return main;
  }
  return './' + env.normalizePath(path.join(path.dirname(main), dep));
};

// 根据两个相对于base的模块，计算出这两个模块的依赖关系.
// lib/a.js, core/b.js ==> ../core/b.js;
exports.getRelativeBaseModulePath = function(base, module) {
  var module = env.normalizePath(path.relative(path.dirname(base), module));
  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }
  return module;
};
