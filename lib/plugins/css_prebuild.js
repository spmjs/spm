'use strict';

var path = require('path');
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var Graph = require('../utils/dep_graph.js');
var moduleHelp = require('../utils/module_help.js');
var plugin = module.exports = Plugin.create('css-prebuild');

/**
 * 首先处理 css 模块内部的依赖合并.
 * 分析出来每一个 css 的依赖关系，然后保存在对应的数据结构
 * 在分析的时候需要检测循环依赖，如果有循环依赖抛出错误，主要是内部模块检查
 * a->b->c
 * 然后如果没有循环依赖，则开始合并。其中首先算出内部模块的依赖图，然后从出度为 0 的模块开始生成。
 * 然后在 output 代码合并完成后，在重新进行全局模块依赖的模块分析。
 */
plugin.run = function(project, callback) {
  var build = project.buildDirectory;

  // 用来计算处理顺序.
  var gSort = new Graph();

  fsExt.listFiles(build, /\.css$/).forEach(function(mod) {
    var node = gSort.add(mod); 
    getDepMods(mod).forEach(function(subMod) {
      subMod = project.getDepModulePath(mod, subMod);
      var subNode = gSort.add(subMod); 
      node.addEdge(subNode); 
    });
  });

  var mergePaths = Graph.findSubNodeDepPath(gSort);


  // 可能有多条合并路径，取决于被依赖数为0的模块个数.
  mergePaths.forEach(function(mergePath) {
    
    // 记录已经合并过的模块
    var merged = [];
    var mergePath =  Graph.getAllNodesByRootNode(mergePath[0]);

    for(var len = mergePath.length; len > 0; len--) {
      mergeCssMod(mergePath[len-1], merged, project);
    }
  });

  callback();
};

var cssImportReg = /^@import\s+(?:url\s*\(\s*['"]?|['"])((?!http:|https:|ftp:|\/\/)[^"^'^\s]+)(?:['"]?\s*\)|['"])\s*([\w\s\(\)\d\:,\-]*);.*$/gm;

function getDepMods(cssMod) {
  var deps = [];
  var cssCode = fsExt.readFileSync(cssMod);
  cssCode.replace(cssImportReg, function(match, dep) {
    if (dep.indexOf('.') == 0) {
      deps.push(dep);
    }
  });
  return deps;
}

// 按照依赖的顺序，开始合并，在整个依赖链路中，一个模块只能合并一次.

function mergeCssMod(node, merged, project) {

  var modPath = node.name;
  var cssCode = fsExt.readFileSync(modPath);
  var hasDeps = false;

  cssCode = cssCode.replace(cssImportReg, function(match, depMod) {
    if (depMod.indexOf('.') == 0) {
      var subModPath = path.join(path.dirname(modPath), depMod);
      if (merged.indexOf(subModPath) > -1) {
        return '';
      }

      hasDeps = true;
      merged.push(subModPath);
      var subModName = path.relative(project.buildDirectory, subModPath);
      return '/** ' + subModName + ' **/\n\n' + fsExt.readFileSync(subModPath);
    } else {
      return match;
    }
  });

  if (hasDeps) {
    fsExt.writeFileSync(modPath, cssCode);
  }
}
