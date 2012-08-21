// css 处理插件
// 用户可以通过 convertStyle 可以在命令中和package.json覆盖默认行为.
// convertStyle:
//   none: 不处理
//   inline: 内嵌
//   js: 生成异步加载js

var async = require('async');
var path = require('path');
var Plugin = require('../core/plugin.js');
var cssCompress = require('../compress/css_compress.js');
var fsExt = require('../utils/fs_ext.js');
var cssPlugin = module.exports = Plugin.create('css');

cssPlugin.param('convertStyle', 'inline', 'convert style [none | inline | js]');
cssPlugin.param('build', '%buildDirectory%');

cssPlugin.run = function(callback) {
  var that = this;
  var project = this.project;
  var build = this.build;
  var convertStyle = this.convertStyle;

  var cssModPattern = project.getReqModRegByType('[^\"\']+\\.css');

  if (convertStyle !== 'inline' && convertStyle !== 'js') {

    // 不处理, 直接输出.
    callback();
    return;
  }

  var cssCache = this.cssCache = {};
  var modules = fsExt.list(build, /js$/);
  var queue = async.queue(function(cssModule, callback) {
    var cssModulePath = path.join(build, cssModule);
    cssCompress(cssModulePath, function(code) {
      cssCache[cssModule] = code.replace(/'/g, '"');
      callback();
    });
  }, 5);

  modules = modules.filter(function(moduleName) {
    var code = fsExt.readFileSync(build, moduleName);
    if (!cssModPattern.test(code)) {
      return false;
    } else {
      code.replace(cssModPattern, function(match, sep, mark, depModName) {
        queue.push(getDepModPath(moduleName, depModName));
      });
      return true;
    }
  });

  if (!queue.length()) {
    // 没有要处理的
    callback();
    return;
  }

  queue.drain = function() {
    modules.forEach(function(moduleName) {
      var code;
      var codePath = path.join(build, moduleName);
      if (convertStyle === 'inline') {
        code = getReplacedImportStyleCode(moduleName);
      } else {
        code = getReplacedRequireCssJsCode(moduleName);
      }
      fsExt.writeFileSync(codePath, code);
    });
    callback();
  };
};

function getReplacedImportStyleCode(moduleName) {
  var cssModPattern = cssPlugin.project.getReqModRegByType('[^\"\']+\\.css');
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));
  return code.replace(cssModPattern, function(match, sep, mark, depModName) {
    return sep + getImportStyle(moduleName, depModName);
  });
}

// 1. 输出csjs
// 2. replace require
// 3. add output
// 4. add deps
function getReplacedRequireCssJsCode(moduleName) {
  var cssModPattern = cssPlugin.project.getReqModRegByType('[^\"\']+\\.css');
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));
  return code.replace(cssModPattern, function(match, sep, mark, depModName) {
    outputCssJs(moduleName, depModName);
    addCssJsToOutput(moduleName, depModName);
    addCssJsToDependencies(moduleName, depModName);
    return sep + "require('" + depModName + '.js' + "')";
  });
}

function getImportStyle(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  var cssModId = cssPlugin.project.getModuleId(cssModName);
  var cssCode = cssPlugin.cssCache[cssModName];
  return 'seajs.importStyle(' + "'" + cssCode + "', '" + cssModId + "')";
}

function outputCssJs(modName, depModName) {
  var cssModPath = path.join(cssPlugin.build, getDepModPath(modName, depModName));
  var cssJsModPath = cssModPath + '.js';
  var code = 'define(function(require) {' + getImportStyle(modName, depModName) + '})';
  fsExt.writeFileSync(cssJsModPath, code);
}

function addCssJsToOutput(modPath, depModName) {
  var project = cssPlugin.project;
  var output = project.output;
  var cssJsModName = getDepModPath(modPath, depModName) + '.js';
  output[cssJsModName] = [cssJsModName];
}

function getDepModPath(mainMod, depMod) {
  var project = cssPlugin.project;
  return project.getDepModulePath(mainMod, depMod);
}

function addCssJsToDependencies(moduleName, depModName) {
  var project = cssPlugin.project;
  var moduleId = project.getModuleId(moduleName);
  var cssJsDepModName = depModName + '.js';
  var deps = project.moduleDepMapping[moduleId];
  if (deps.indexOf(cssJsDepModName) < 0) {
    deps.push(cssJsDepModName);
  }
}
