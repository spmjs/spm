// css 处理插件
// 根据 css 插件的分析，去检查输出模块是否有需要合并的 css 模块，然后进行合并.

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
var plugin = module.exports = Plugin.create('js-merge-css');

plugin.run = function(project, callback) {
  var that = this;
  plugin.project = project;
  var dist = plugin.dist = project.distDirectory;
  var build = plugin.build = project.buildDirectory;
  var tempOutput = project.tempOutput;
  var moduleCache = project.moduleCache;

  var modules = fsExt.list(dist, /js$/);

  async.forEachSeries(modules, function(moduleName, cb) {
    var cssDeps = moduleCache.getCssDeps(moduleName);
    var cssCache = {};
    var modId = project.getModuleId(moduleName);
    if (!cssDeps.length) {
      cb();
      return;
    }

    async.forEach(cssDeps, function(dep, cb) {
      var cssDepId;
      var isLocal = true;
      var newDep = project.getGlobalModuleId(dep, true);

      if (!isCss(newDep)) {
        cb();
        return;
      }

      if (isRelative(newDep, dist)) {
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
        getCssCode(path.join(dist, getDepModPath(moduleName, dep)), function(code) {
          cssCache[cssDepId] = getImportStyleCssCode(cssDepId, code);
          cb();
        });
      } else {
        getGlobalCssCode(newDep, function(code) {
          cssCache[newDep] = getImportStyleCssCode(cssDepId, code);
          cb();
        });
      }
    }, function() {
      // 替换 css 模块，并重新输出 js 模块.
      that.addCssModule(moduleName, cssCache);
      cb();
    });
  }, function(err) {

    if (Object.keys(tempOutput).length > 0) {
      // 删除临时添加的输出文件. 
      var cssReg = /\.css$/;
      Object.keys(tempOutput).forEach(function(key) {
        fsExt.rmSync(path.join(dist, key));
        fsExt.rmSync(path.join(dist, key.replace(cssReg, '-' + project.debugName + '.css')));
        fsExt.rmSync(path.join(dist, key.replace(cssReg, '-full-' + project.debugName + '.css')));
        fsExt.rmSync(path.join(dist, key.replace(cssReg, '-full.css')));
      });
      /**
      fsExt.listFiles(dist, /^inner/).forEach(function(f) {
        console.info('f------->',f);
      });
      **/
    }

    callback(); 
  });
};

function getCssCode(modPath, cb) {
  modPath = modPath.replace(/\.css$/, '-full.css');
  var code = fsExt.readFileSync(modPath);

  cleanCss(modPath, function(code) {
    code = code.replace(/'/g, '"');
    cb(code);
  });
}

function getGlobalCssCode(modId, cb) {
  modId = modId.replace(/\.css$/, '-full.css');
  plugin.project.getGlobalModuleCode(modId, function(code) {
    code = code.replace(/'/g, '"');
    cb(code);
  });
}

plugin.addCssModule= function(moduleName, cssCache) {
  var dist = this.dist;
  var project = this.project;

  var modulePath = path.join(dist, moduleName);
  var debugModulePath = path.join(dist, 
        moduleHelp.getDebugModule(moduleName, '-' + project.debugName));

  var code = fsExt.readFileSync(modulePath);
  var debugCode = fsExt.readFileSync(debugModulePath);

  Object.keys(cssCache).forEach(function(key) {
    code += ('\n' + cssCache[key]);
    debugCode += ('\n' + cssCache[key]);
  });

  fsExt.writeFileSync(modulePath, code);
  fsExt.writeFileSync(debugModulePath, debugCode);
};

function getReplacedImportStyleCode(moduleName) {
  var build = plugin.build;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  return Ast.replaceRequireNode(code, isCss, function(node, depModName) {
    return getImportStyleNode(moduleName, depModName);
  });
}

// 1. 产出 css_js 模块，并缓存.
// 2. 替换 js 中的 require
// 3. 合并到 js 文件的尾部
function getReplacedRequireCssJsCode(moduleName) {
  var build = plugin.build;
  var project = plugin.project;
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
  return plugin.project.getModuleId(cssModName);
}

function getImportStyle(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  var cssModId = plugin.project.getModuleId(cssModName);
  var cssCode = plugin.cssCache[cssModName];


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
  var project = plugin.project;
  var output = project.output;
  var cssJsModName = getDepModPath(modPath, depModName) + '.js';
  output[cssJsModName] = [cssJsModName];
}

function getDepModPath(mainMod, depMod) {
  var project = plugin.project;
  return project.getDepModulePath(mainMod, depMod);
}

function addCssJsToDependencies(moduleName, depModName) {
  var project = plugin.project;
  var moduleId = project.getModuleId(moduleName);
  var cssJsDepModName = depModName + '.js';
  var deps = project.moduleDepMapping[moduleId];
  if (deps.indexOf(cssJsDepModName) < 0) {
    deps.push(cssJsDepModName);
  }
}


