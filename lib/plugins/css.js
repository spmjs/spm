// css 处理插件
// @since 1.7 规则改为: js 模块中依赖的 css 模块始终会被被转换为 js 模块，然后产生的css.js 模块文件会被合并到对应依赖的 js 模块文件中.
// 具体参看 https://github.com/spmjs/spm/issues/641#issuecomment-14102073
// 背景:
// 1. 其中内部依赖的 css 模块也可以需要进行依赖合并，所以需要等到 css 合并流程走完后才能合并。
// 2. 由于依赖的 css 模块是 js 的必需附属品，所以他的依赖关系可以不出现在依赖列表中，因为他一定被合并到文件中了.
// 实现:
// 1. 首先我们需要删除 css 的模块的依赖，避免影响到后续的正常的合并。
// 2. 然后我们需要记录住对应的模块需要合并的 css 模块。
// 3. 开始进行正常流程的合并输出
// 4. 正常合并完成后，我们在去检查输出模块是否有需要合并的 css 模块，然后进行合并.

'use strict';

var async = require('async');
var path = require('path');

var Plugin = require('../core/plugin.js');
var cleanCss = require('../compress/clean_css.js');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var StringUtil = require('../utils/string.js');
var Ast = require('../utils/ast.js');

var isCss = moduleHelp.isCss;
var isRelative = moduleHelp.isRelative;
var cssPlugin = module.exports = Plugin.create('css');

cssPlugin.run = function(project, callback) {
  var that = this;
  cssPlugin.project = project;
  project.tempOutput = {};
  var build = cssPlugin.build = project.buildDirectory;
  var moduleCache = project.moduleCache;

  var modules = fsExt.list(build, /js$/);

  async.forEachSeries(modules, function(moduleName, cb) {
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

      moduleCache.addCssDep(moduleName, dep);
      cb();

    }, function() {
      // 替换 css 模块，并重新输出 js 模块.
      that.findCssModAndReplace(moduleName, function(code) {
        var codePath = path.join(build, moduleName);
        fsExt.writeFileSync(codePath, code);
        cb(); 
      });
    });
  }, function(err) {
    callback(); 
  });
};

cssPlugin.findCssModAndReplace = function(moduleName, cb) {
  var build = this.build;
  var project = this.project;
  var output = project.output;
  var tempOutput = project.tempOutput;
  var code = fsExt.readFileSync(path.join(build, moduleName));

  code = Ast.replaceRequireValue(code, function(depModName) {
    var cssJsCode, cssDepId;

    var newDep = project.getGlobalModuleId(depModName, true);
    if (!isCss(newDep)) { 
      return depModName;
    }

    if (isRelative(newDep, build)) {
      // 检查相对依赖的 css 模块是否在 output 有输出，如果没有，需要临时添加进去
      // 后续的程序会对临时添加产生的文件进行删除.
      if (!(output[newDep] || output[path.normalize(newDep)])) {
        output[path.normalize(newDep)] = '.'; 
        tempOutput[path.normalize(newDep)] = '.'; 
      }
      cssDepId = getCssModuleId(moduleName, newDep); 
    } else {
      cssDepId = newDep;
    }
    
    return cssDepId;
  }); 
  cb(code);
};

function getCssModuleId(modName, depModName) {
  var cssModName = getDepModPath(modName, depModName);
  return cssPlugin.project.getModuleId(cssModName);
}

function getDepModPath(mainMod, depMod) {
  var project = cssPlugin.project;
  return project.getDepModulePath(mainMod, depMod);
}
