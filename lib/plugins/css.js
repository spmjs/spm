// css 处理插件
// @since 1.7 规则改为: js 模块中依赖的 css 模块始终会被被转换为 js 模块，然后产生的css.js 模块文件会被合并到对应依赖的 js 模块文件中.
// 具体参看 https://github.com/spmjs/spm/issues/641#issuecomment-14102073

'use strict';

var async = require('async');
var path = require('path');
var util = require('util');
var UglifyJS = require('uglify-js');

var Plugin = require('../core/plugin.js');
var cleanCss = require('../compress/clean_css.js');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var depUtil = require('../utils/dependences.js');
var StringUtil = require('../utils/string.js');
var Ast = require('../utils/ast.js');

var isCss = moduleHelp.isCss;
var isRelative = moduleHelp.isRelative;
var cssPlugin = module.exports = Plugin.create('css');

cssPlugin.run = function(project, callback) {
  var that = this;
  cssPlugin.project = project;
  var build = cssPlugin.build = project.buildDirectory;
  var moduleCache = project.moduleCache;

  var cssCache = this.cssCache = {};
  var modules = fsExt.list(build, /js$/);

  async.forEachSeries(modules, function(moduleName, cb) {
    moduleName = moduleHelp.normalizeRelativeMod(moduleName);
    var allDeps = moduleCache.getAllDeps(moduleName) || [];
    var modId = project.getModuleId(moduleName);
    var deps = project.moduleDepMapping[modId];

    var hasCssMod = allDeps.some(function(dep) {
      dep = project.getGlobalModuleId(dep, true);
      return isCss(dep);
    });

    if (!hasCssMod) {
      cb();
      return;
    }

    // 提前加载 css 模块文件，因为 css 模块包含全局模块，存在异步处理.

    async.forEach(allDeps, function(dep, cb) {
      var cssDepId;
      var isLocal = true;
      var newDep = project.getGlobalModuleId(dep, true);

      if (!isCss(newDep)) {
        cb();
        return;
      }

      deps.splice(deps.indexOf(dep), 1);

      if (isRelative(newDep, build)) {
        cssDepId = getCssModuleId(moduleName, newDep); 
      } else {
        cssDepId = newDep;
        isLocal = false;
      }

      if (cssCache[cssDepId]) {
        cb();
        return;
      }

      if (isLocal) {
        getCssCode(path.join(build, getDepModPath(moduleName, dep)), function(code) {
          cssCache[cssDepId] = code;
          cb();
        });
      } else {
        getGlobalCssCode(newDep, function(code) {
          cssCache[newDep] = code;
          cb();
        });
      }
    }, function() {
      // 替换 css 模块，并重新输出 js 模块.
      that.findCssModAndReplace(moduleName, cssCache, function(code) {
        var codePath = path.join(build, moduleName);
        fsExt.writeFileSync(codePath, code);
        cb(); 
      });
    });
  }, function(err) {
    callback(); 
  });
};

function getCssCode(modPath, cb) {
  var code = fsExt.readFileSync(modPath);

  cleanCss(modPath, function(code) {
    cb(code);
  });
}

function getGlobalCssCode(modId, cb) {
  cssPlugin.project.getGlobalModuleCode(modId, function(code) {
    cb(code);
  });
}

cssPlugin.findCssModAndReplace = function(moduleName, cssCache, cb) {
  var build = this.build;
  var project = this.project;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  var cssCodes = {};

  code = Ast.replaceRequireValue(code, function(depModName) {
    var cssJsCode, cssDepId;

    var newDep = project.getGlobalModuleId(depModName, true);
    if (!isCss(newDep)) { 
      return depModName;
    }

    if (isRelative(newDep, build)) {
      cssDepId = getCssModuleId(moduleName, newDep); 
    } else {
      cssDepId = newDep;
    }

    var cssJsCode = getImportStyleCssCode(cssDepId, cssCache[cssDepId]);
    if (!cssCodes[cssDepId]) {
      cssCodes[cssDepId] = cssJsCode;
    }

    return newDep + '#';
  }); 

  Object.keys(cssCodes).forEach(function(key) {
    code += ('\n' + cssCodes[key]);
  });

  cb(code);
};

function getReplacedImportStyleCode(moduleName) {
  var build = cssPlugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  return Ast.replaceRequireNode(code, isCss, function(node, depModName) {
    return getImportStyleNode(moduleName, depModName);
  });
}

// 1. 产出 css_js 模块，并缓存.
// 2. 替换 js 中的 require
// 3. 合并到 js 文件的尾部
function getReplacedRequireCssJsCode(moduleName) {
  var build = cssPlugin.build;
  var project = cssPlugin.project;
  var code = fsExt.readFileSync(path.join(build, moduleName));
  var cssMods = {};

  return Ast.replaceRequireValue(code, function(depModName) {
    var cssJsCode;

    var newDepModName = project.getGlobalModuleId(depModName, true);
    if (!isCss(newDepModName)) { 
      return depModName;
    }

    var cssJsCode = getImportStyleCssCode(moduleName, newDepModName);
    // addCssJsToDependencies(moduleName, depModName);
    return depModName + '.js';
  }); 
}

var cssModuleTpl = fsExt.readFileSync(path.join(path.dirname(module.filename),
        '../help/css_module_template.js'));

function getImportStyleCssCode(cssModId, cssCode) {

  return StringUtil.tmpl(cssModuleTpl, {
    id: cssModId,
    css: cssCode
  });
}

function getCssModuleId(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  return cssPlugin.project.getModuleId(cssModName);
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

