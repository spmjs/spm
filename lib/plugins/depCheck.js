/**
 * 依赖检查. 在所有的模块依赖中查找是否存在一个模块多个版本.
 * @param {Object} project 项目模型信息.
 * @param {Function} callback 项目模型信息.
 */
var path = require('path');

var Plugin = require('../core/plugin.js');
var moduleHelp = require('../utils/module_help.js');
var isRelative = moduleHelp.isRelative;

var plugin = module.exports = Plugin.create('depCheck');
plugin.run = function(project, callback) {
  var modDepMapping = project.moduleDepMapping;
  var reservedDeps = project.reservedDeps;

  var isValidModule = function(modId) {
    if (isRelative(modId)) return false;
    if (reservedDeps.indexOf(modId) > -1) return false;
    if (modId === getMainModule(modId)) return false;
    return true;
  };

  Object.keys(modDepMapping).forEach(function(mod) {
    var dep, version, context;
    var conflictMod = [];

    var deps = modDepMapping[mod].filter(function(dep) {
      return isValidModule(dep);
    }).map(function(dep) {
      return getMainModule(dep);
    });

    deps = unique(deps);

    while (dep = deps.pop()) {
      version = path.basename(dep);
      context = path.dirname(dep);
      deps.forEach(function(d) {
        if (d.indexOf(context) > -1) {
          var newVersion = path.basename(d);
          if (newVersion != version) {
            conflictMod.push(dep + ',' + d);
          }
        }
      });
    }

    if (conflictMod.length > 0) {
      var allDepLink = getAllDepLink(modDepMapping, reservedDeps);

      conflictMod.forEach(function(mod) {
        var mods = mod.split(',');
        console.warn('Find conflicted module [' + mods.join(' : ') + ']');
        console.empty();
        Object.keys(allDepLink).forEach(function(mainMod) {
          if (mainMod.indexOf(mods[0]) > -1) {
            return;
          }

          var deps = allDepLink[mainMod];
          var cmod = '';

          if (deps.indexOf(mods[0]) > -1) {
            cmod = mods[0];
          }

          if (deps.indexOf(mods[1]) > -1) {
            cmod = cmod + ' ' + mods[1];
          }

          if (cmod) {
            console.warn('  ' + mainMod + ' ----> ' + cmod);
          }
        });
        console.segm();
      });
    }
  });

  callback();
};


function getAllDepLink(modDepMapping, reservedDeps) {
  var allDepLink = {};
  Object.keys(modDepMapping).forEach(function(mainMod) {
    var deps = modDepMapping[mainMod];

    deps = deps.filter(function(dep) {
      return !isRelative(dep) && reservedDeps.indexOf(dep) < 0;
    }).map(function(dep) {
      return getMainModule(dep);
    });

    if (deps.length > 0) {
      allDepLink[mainMod] = deps;
    }
  });

  return allDepLink;
}

function getMainModule(modId) {
  // 对dep进行重整,删除版本以后的部分
  var versionPos = modId.search(/(?:\d\.){2}\d(?:-dev)?/);

  // 如果不包含标准的版本号，则直接返回模块id本身.
  if (versionPos === -1) {
    return modId;
  }

  return modId.slice(0, modId.indexOf('/', versionPos));
}

function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}
