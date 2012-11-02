// css 处理插件
// 用户可以通过 convertStyle 可以在命令中和package.json覆盖默认行为.
// convertStyle:
//   none: 不处理
//   inline: 内嵌
//   js: 生成异步加载js

var async = require('async');
var path = require('path');
var util = require('util');
var Plugin = require('../core/plugin.js');
var cleanCss = require('../compress/clean_css.js');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var cssPlugin = module.exports = Plugin.create('css');

cssPlugin.param('convert-style', 'inline', 'convert style [none | inline | js]');

cssPlugin.run = function(project, callback) {
  var that = this;
  var build = cssPlugin.build = project.buildDirectory;

  var convertStyle = project.getConfig('convert-style') || this['convert-style'];
  var cssModPatternForCheck = project.getReqModRegByType('[^\"\']+\\.css', false);
  var cssModPattern = project.getReqModRegByType('[^\"\']+\\.css');


  var cssCache = this.cssCache = {};
  var modules = fsExt.list(build, /js$/);
  var queue = async.queue(function(cssModule, callback) {
    var cssModulePath = path.join(build, cssModule);

    cleanCss(cssModulePath, function(code) {
      cssCache[cssModule] = code.replace(/'/g, '"');
      callback();
    });
  }, 5);

  modules = modules.filter(function(moduleName) {
    var code = fsExt.readFileSync(build, moduleName);
    if (!cssModPatternForCheck.test(code)) {
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
      var codePath = path.join(build, moduleName);
      var code = fsExt.readFileSync(codePath);
      if (convertStyle === 'inline') {
        code = getReplacedImportStyleCode(moduleName);
      } else if (convertStyle === 'js') {
        code = getReplacedRequireCssJsCode(moduleName);
      }

      // 如果用户使用了 inline 和 js 需要 说明用户使用了 require('./xxx.css');
      var modId = project.getModuleId(moduleName);
      var deps = project.moduleDepMapping[modId];
      if (convertStyle !== 'none') {
        // 代码不做变化，在deps中删除css相对依赖.
        project.moduleDepMapping[modId] = deps.filter(function(dep) {
          return !(moduleHelp.isRelative(dep) && moduleHelp.isCss(dep));
        });
      } else {
        // 检查模块内对 css 的依赖，是否添加到了，output中
        // 并检查 require 的 css 文件是否是被合并的 css 文件。
        code = cssRequireCheck(getCssOutput(project.output), moduleName, deps);
      }
      fsExt.writeFileSync(codePath, code);
    });
    callback();
  };
};

function getCssOutput(output) {
  var cssOutput = {};

  Object.keys(output).forEach(function(key) {
    if (moduleHelp.isCss(key)) {
      var value = output[key];
      if (typeof value === 'string') {
        value = [value];
      } else {
        value = value.slice(0);
      }

      value = value.map(function(v) {
        return relativeModule(v);
      });

      cssOutput[relativeModule(key)] = value;
    }
  });

  return cssOutput;
}

// a.js ==> ./a.js
// b.css ==> ./b.css
function relativeModule(name) {
   if (name.indexOf('.') !== 0) {
     return './' + name;
   } else {
     return name;
   }
}

// 需要根据 js 模块的路径计算出 css 模块的位置。 
function cssRequireCheck(cssOutput, moduleName, deps) {
  var cssModPattern = cssPlugin.project.getReqModRegByType('[^\"\']+\\.css');
  var build = cssPlugin.build;
  
  var code = fsExt.readFileSync(path.join(build, moduleName));
  return code.replace(cssModPattern, function(match, sep, mark, depModName) {
    var depModNamePath = moduleHelp.getBaseDepModulePath(moduleName, depModName);
    var keys = Object.keys(cssOutput);

    if (cssOutput[depModNamePath]) return match;

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      var value = cssOutput[key];

      if (util.isArray(value) && value.indexOf(depModNamePath) > -1) {

        // 需要对模块的依赖列表也进行检查替换。
        var realDep = value[value.indexOf(depModNamePath)];
        var depIndex = deps.indexOf(realDep); 
        deps.splice(depIndex, 1, key);
        return sep + "require('" + key + "')";
      };
    }
    throw new Error(moduleName + ' css require error!( ' + match + ' )');
  });
}

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
