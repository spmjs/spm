// css 处理插件
// 用户可以通过 convertStyle 可以在命令中和package.json覆盖默认行为.
// convertStyle:
//   none: 不处理
//   inline: 内嵌
//   js: 生成异步加载js

var async = require('async');
var path = require('path');
var util = require('util');
var UglifyJS = require('uglify-js');

var Plugin = require('../core/plugin.js');
var cleanCss = require('../compress/clean_css.js');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var depUtil = require('../utils/dependences.js');
var Ast = require('../utils/ast.js');

var isCss = moduleHelp.isCss;
var cssPlugin = module.exports = Plugin.create('css');

cssPlugin.run = function(project, callback) {
  var build = cssPlugin.build = project.buildDirectory;
  var moduleCache = project.moduleCache;

  var convertStyle = project.getConfig('convertStyle') || 'inline';

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
    moduleName = moduleHelp.normalizeRelativeMod(moduleName);
    var allDeps = moduleCache.getAllDeps(moduleName) || [];

    var hasCssMod = allDeps.some(function(dep) {
      return isCss(dep);
    });

    if (!hasCssMod) {
      return false;
    } else {
      allDeps.forEach(function(depModName) {
        if (isCss(depModName)) {
          queue.push(getDepModPath(moduleName, depModName));
        }
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
          return !(moduleHelp.isRelative(dep) && isCss(dep));
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
    if (isCss(key)) {
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
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  return Ast.replaceRequireValue(code, function(depModName) {
    if (!isCss(depModName)) {
      return depModName;
    }

    var depModNamePath = moduleHelp.getBaseDepModulePath(moduleName, depModName);
    var keys = Object.keys(cssOutput);

    if (cssOutput[depModNamePath]) return depModName;

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      var value = cssOutput[key];

      if (util.isArray(value) && value.indexOf(depModNamePath) > -1) {

        // 需要对模块的依赖列表也进行检查替换。
        var realDep = value[value.indexOf(depModNamePath)];
        var depIndex = deps.indexOf(realDep);
        deps.splice(depIndex, 1, key);
        return key;
      }
    }
    throw new Error(moduleName + ' css require error!( ' + match + ' )');
  });
}

function getReplacedImportStyleCode(moduleName) {
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  return Ast.replaceRequireNode(code, isCss, function(node, depModName) {
    return getImportStyleNode(moduleName, depModName);
  });
}

// 1. 输出csjs
// 2. replace require
// 3. add output
// 4. add deps
function getReplacedRequireCssJsCode(moduleName) {
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));
  return Ast.replaceRequireValue(code, function(depModName) {
    if (!isCss(depModName)) {
      return depModName;
    }

    outputCssJs(moduleName, depModName);
    addCssJsToOutput(moduleName, depModName);
    addCssJsToDependencies(moduleName, depModName);
    return depModName + '.js';
  }); 
}

function getImportStyle(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  var cssModId = cssPlugin.project.getModuleId(cssModName);
  var cssCode = cssPlugin.cssCache[cssModName];
  return 'seajs.importStyle(' + "'" + cssCode + "', '" + cssModId + "')";
}

function getImportStyleNode(modName, depModName) {
  var styleNodeStr = getImportStyle(modName, depModName);
  var ast = UglifyJS.parse(styleNodeStr);
  var styleNode = null;

  var findImportStyle = new UglifyJS.TreeWalker(function(node) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'seajs') {
      styleNode = node.clone();
      return true;
    }
  });
  ast.walk(findImportStyle);
  if (!styleNode) {
    throw new Error("解析样式依赖错误(" + modName + ' ' + depModName + ")");
  }
  return styleNode;
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
