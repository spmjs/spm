// css 处理插件
// 根据 css 插件的分析，去检查输出模块是否有需要合并的 css 模块，然后进行合并.

'use strict';

var async = require('async');
var path = require('path');

var Plugin = require('../core/plugin.js');
var cleanCss = require('../compress/clean_css.js');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var StringUtil = require('../utils/string.js');

var isCss = moduleHelp.isCss;
var isRelative = moduleHelp.isRelative;
var plugin = module.exports = Plugin.create('js-merge-css');

plugin.run = function(project, callback) {
  var that = this;
  plugin.project = project;
  var dist = plugin.dist = project.distDirectory;
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

var cssModuleTpl = fsExt.readFileSync(path.join(path.dirname(module.filename),
        '../help/css_module_template.js'));

function getImportStyleCssCode(cssModId, cssCode) {
  if (cssCode.indexOf('\\0') > -1) {
    cssCode = cssCode.replace(/\\0/g, '\\\\0');
  }
  return StringUtil.tmpl(cssModuleTpl, {
    id: cssModId,
    css: cssCode
  });
}

function getCssModuleId(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  return plugin.project.getModuleId(cssModName);
}

function getDepModPath(mainMod, depMod) {
  var project = plugin.project;
  return project.getDepModulePath(mainMod, depMod);
}
