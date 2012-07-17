// 依赖分析
// 在这个模块里面，会对所有的模块进行依赖分析，命名替换等操作。

var util = require('util');
var path = require('path');
var async = require('async');

var Sources = require('./sources');
var astParser = require('uglify-js').parser;
var Ast = require('../../../utils/ast.js');

var splice = Array.prototype.splice;

var fsExt = require('../../../utils/fs_ext.js');

function Dependency(project) {
  this.project = project;
  this.srcDir = project.srcDirectory;
  this.sources = new Sources(true, project);
}

/**
 * 获取项目所有模块直接的依赖关系
 * { '#widget/0.9.13/templatable':
 *  [ '#jquery/1.7.2/jquery',
 *    '#handlebars/1.0.0/handlebars',
 *    '#widget/0.9.13/ast-printer'
 *   ]
 * }
 *
 * @return {Object} 模块依赖关系.
 */
Dependency.prototype.getModuleDepMapping = function(callback) {
  if (!this.moduleDepMapping) {
    this.initModuleDepMapping(callback);
  } else {
    callback(this.moduleDepMapping);
  }
};

/** 初始化项目中具体的模块文件和最终的模块ID的对应关系.
 * {
 *  'switchable.js': ['#jquery/1.7.2/jquery',
 *      '#widget/0.9.4/widget', './plugin/auto.js']
 * }
*/
Dependency.prototype.initModuleDepMapping = function(callback) {
  var that = this;
  var moduleList = this.project.moduleList;
  var moduleDepMapping = this.moduleDepMapping = {};

  // 分类计算出global dep, local dep, tpl.
  var moduleAllDepMapping = {};

  // 先计算出所有的模块的内部依赖和全局依赖.
  async.forEachSeries(moduleList, function(moduleName, callback) {
      that.getModuleAllDepMapping(moduleName, function(deps) {
          moduleAllDepMapping[that.getModuleId(moduleName)] = deps;
          callback();
        });
  }, function() {
    // 当所有的模块分析完成后, 对本地模块依赖进行分析，计算出整个依赖路径
    // 目前打算先计算具
    Object.keys(moduleAllDepMapping).forEach(function(moduleId) {
      that.parseLocalDeps(moduleAllDepMapping, moduleId);
    });
    Object.keys(moduleAllDepMapping).forEach(function(moduleId) {
      moduleDepMapping[moduleId] = that.getAllDeps(moduleAllDepMapping,
          moduleId);
    });
    callback(moduleDepMapping);
  });
};

/**
 * 获取moduleId
 * @param {String} moduleName 模块名称.
 * @return {String} 模块ID.
 */
Dependency.prototype.getModuleId = function(moduleName) {
  return this.project.getModuleId(moduleName);
};

/**
 * 获取内部模块依赖的id, 主要是需要计算相对路径.
 * @param {Object} activeModule 当前模块.
 * @param {String} moduleName 依赖的内部模块名称.
 * @return {String} 模块ID.
 */
Dependency.prototype.getDepModuleId = function(activeModule, moduleName) {
  return this.project.getDepModuleId(activeModule, moduleName);
};

/**
 * 循环计算所有的内部依赖.
 * @param {Object} modAllDepMapping 模块的整个依赖关系.
 * @param {String} modId 模块ID.
 */
Dependency.prototype.parseLocalDeps = function(modAllDepMapping, modId) {
  var subModName,
    subModuleId,
    subModuleDeps;
  var that = this;
  var local = modAllDepMapping[modId].local;
  var moduleName = modAllDepMapping[modId].moduleName;
  while (subModName = local.shift()) {
    if (isModuleId(subModName)) {
      local.unshift(subModName);
      break;
    }
    subModuleId = this.getDepModuleId(moduleName, subModName);
    local.push(subModuleId);
    subModuleDeps = modAllDepMapping[subModuleId].local;

    if (subModuleDeps.length > 0 && isModuleId(subModuleDeps[0])) {
      // 因为local中发现替换过的模块,表明此模块已经替换过，直接加入
      //console.log('submodule----', subModuleDeps)
      splice.apply(local, [local.length, 0].concat(subModuleDeps));
    } else {
      subModuleDeps.forEach(function(subModule) {
        var depModId = that.getDepModuleId(subModName, subModule);
        if (depModId === subModuleId) {

          // 发现循环依赖
          return;
        }
        local.unshift(path.join(path.dirname(subModName), subModule));
      });
    }
  }
  modAllDepMapping[modId].local = unique(modAllDepMapping[modId].local);
};

/**
 * 返回指定模块的整个依赖关系，包括全局和内部.
 * @param {Object} moduleAllDepMapping 项目所有模块的依赖关系映射表.
 * @param {String} moduleId 模块ID.
 * @return {Array} 返回对应模块的依赖关系.
 */
Dependency.prototype.getAllDeps = function(moduleAllDepMapping, moduleId) {
  var local = moduleAllDepMapping[moduleId].local;
  var allDeps = moduleAllDepMapping[moduleId].global.slice(0);

  local.forEach(function(subLocalModuleId) {
    allDeps.push(subLocalModuleId);
    var subModuleGlobalDep = moduleAllDepMapping[subLocalModuleId].global;
    [].splice.apply(allDeps,
        [allDeps.length, 0].concat(subModuleGlobalDep));
  });

  return unique(allDeps);
};

/**
 * 分析给定模块的依赖关系. 并把相应的依赖转换为模块id.
 * 并根据依赖的内容，保存在global, local, tpl三部分
 * @param {String} moduleName 模块名称.
 * @return {Object} 返回项目指定模块的整个依赖关系.
 */
Dependency.prototype.getModuleAllDepMapping = function(moduleName, callback) {
//console.log('getModuleAllDepMapping->' + moduleName);
  var that = this;
  var moduleCode = fsExt.readFileSync(this.srcDir, moduleName);
  var deps = parseDependencies(moduleCode);
//console.log(deps)

  var depMapping = {
    global: [],
    local: [],
    tpl: []
  };

  // 保存moduleName, 对后面解析子模块使用.
  depMapping.moduleName = moduleName;

  async.forEachSeries(deps, function(depModuleName, callback) {
    if (depModuleName.indexOf('.tpl') > 0) {
      // 模板开始内嵌
      depMapping.tpl.push(depModuleName);
      callback();
    } else if (depModuleName.indexOf('.css') > 0) {
      console.log('find css!');
      callback();
    } else if (depModuleName.indexOf('.') === 0) {

      // 内部模块依赖
      depMapping.local.push(depModuleName);
      callback();
    } else {
//console.log('find global-->' + depModuleName)
      var globalModuleDeps = GlobalDepMapping[depModuleName];
      if (!globalModuleDeps) {
        globalModuleDeps = (GlobalDepMapping[depModuleName] =
            that.findGlobalModuleDeps(depModuleName, function(deps) {
              splice.apply(depMapping.global,
                  [depMapping.global.length, 0].concat(deps));
              callback();
            }));
      } else {
        splice.apply(depMapping.global,
            [depMapping.global.length, 0].concat(globalModuleDeps));
        callback();
      }
    }
  }, function() {
    depMapping.global = unique(depMapping.global);
    depMapping.local = unique(depMapping.local);
    callback(depMapping);
  });
};

var GlobalDepMapping = {};

/** 根据指定全局模块，获取此模块的依赖列表。
 * define("#widget/0.9.13/widget-debug",
 *  ["base","$","./daparser","./auto-render"],
 *  function(require, exports, module) {
 *
 * @param {String} moduleName 模块名称.
 * @return {Array} 返回指定的全局模块的依赖关系列表.
 */
Dependency.prototype.findGlobalModuleDeps = function(moduleName, callback) {
  var defineId = this.project.moduleDependencies[moduleName];
  var type = this.project.type;
  var globalId = defineId;
  var moduleCode;

  // 如果依赖的不是核心模块.
  if (defineId.indexOf('#') === 0) {
    globalId = defineId.slice(1);
  } else {
    if (this.project.root === '#') {
      defineId = '#' + defineId;
    }
  }
  globalId = globalId + '.' + type;
  
  this.sources.getModule(globalId, function(err, moduleCode) {
    if (err) {
      var errMsg = 'Cannot access module (' + globalId + ')!';
      throw new Error(err);
    }
    callback(parseDepsByModuleCode(defineId, moduleCode)); 
  });
};

function parseDepsByModuleCode(defineId, moduleCode) {
  var ast = astParser.parse(moduleCode);
  var deps = [];
  Ast.walk(ast, 'stat', function(stat) {
    if (stat.toString().indexOf('stat,call,name,define,string,' +
        defineId) !== 0) {
      return stat;
    }

    //[ 'stat', [ 'call', [ 'name', 'define' ],
    //    [ [Object], [Object], [Object] ] ] ]
    var depsArr = stat[1][2][1][1];
    depsArr.forEach(function(dep) {
      deps.push(dep[1]);
    });
    deps.unshift(defineId);
    return stat;
  });
  return deps;
}

var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

function parseDependencies(code) {
  var ret = [], match;
  code = removeComments(code);

  while ((match = moduleNamePattern.exec(code))) {
    if (match[2]) {
      ret.push(match[2]);
    }
  }

  return unique(ret);
}

function removeComments(code) {
  return code
      .replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
      .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
}

function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}

// 判断一个id是否是模块id还是name
// TODO 目前还没有找到太好的方法
function isModuleId(modId) {
  return modId.indexOf('.') !== 0 && modId.split('/').length >= 3;
}

// 检查模块Id是否是核心模块.
function isBaseModuleId(modId) {
  return modId.split('/').length === 3;
}

function getParentTypeByModId(modId) {
  return modId.slice(0, modId.indexOf('/'));
}

/**
 * 输出Dependency模块.
 */
module.exports = Dependency;
