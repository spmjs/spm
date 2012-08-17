/**
 * 依赖检查. 在所有的模块依赖中查找是否存在一个模块多个版本.
 * @param {Object} project 项目模型信息.
 * @param {Function} callback 项目模型信息.
 */
var path = require('path');

var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('depCheck');
plugin.run = function(callback) {
  var project = this.project;
  var modDepMapping = project.moduleDepMapping;
  Object.keys(modDepMapping).forEach(function(mod) {
    var deps = modDepMapping[mod].map(function(dep) {
      if (isRelative(dep)) return dep;

      // 对dep进行重整,删除版本以后的部分
      var versionPos = dep.search(/(?:\d\.){2}\d(?:-dev)?/);
      return dep.slice(0, dep.indexOf('/', versionPos));
    });

    var dep;
    var conflictMod = [];
    deps = unique(deps);
    var version;
    var context;
    while (dep = deps.pop()) {
      if (isRelative(dep)) {
        continue;
      }
      version = path.basename(dep);
      context = path.dirname(dep);
      deps.forEach(function(d) {
        if (isRelative(d)) return;
        if (d.indexOf(context) > -1) {
          var newVersion = path.basename(d);
          if (newVersion != version) {
            conflictMod.push('[' + dep + ':' + d + ']');
          }
        }
      });
    }
    if (conflictMod.length > 0) {
      console.warn('Module ' + mod + ' find confilcted module![' + conflictMod.join(',') + ']');
    }
  });

  callback();
};

function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}

function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0;
}
