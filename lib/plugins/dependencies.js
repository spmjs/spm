'use strict';

var path = require('path');
var async = require('async');
var _ = require('underscore');

var Plugin = require('../core/plugin');
var Sources = require('../core/sources.js');
var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var moduleHelp = require('../utils/module_help.js');
var normalize = moduleHelp.normalizeRelativeMod;
var isAffiliatedMod = moduleHelp.isAffiliatedMod;

var depUtil = require('../utils/dependences.js');

var isTpl = moduleHelp.isTpl;

// TODO 收集模块的所有依赖信息，然后copy文件到build目录，对于id,不做任何替换。
var depPlugin = module.exports = Plugin.create('dependencies');

depPlugin.run = function(project, callback) {
  var that = this;
  var build = project.buildDirectory;
  this.globalModuleCache = {};

  this.moduleCache = project.moduleCache;

  this.sources = new Sources(project);

  // 如果已经解析过依赖.
  this.resolvedModules = {};
  this.filtered = [];

  this.queue = async.queue(function(moduleName, callback) {

    // 如果在解析依赖的过程中已经处理过
    if (that.filtered.indexOf(moduleName) > -1) {
      callback();
      return;
    }

    that.parseJs(moduleName, callback);
  }, 1);

  this.queue.drain = function() {
    callback();
  };

  fsExt.list(build, /\.js$/).forEach(function(moduleName) {
    that.queue.push(moduleName);
  });
};

// 针对js进行替换.
depPlugin.parseJs = function(moduleName, callback) {
  var that = this;
  var project = this.project;
  var build = project.buildDirectory;
  var filepath = path.join(build, moduleName);
  var moduleCode = fsExt.readFileSync(filepath);

  // 如果不是合法
  if (illegalModule(moduleCode)) {
    this.filtered.push(moduleName);
    callback();
    return;
  }

  console.info('PROCESSING MODULE ' + moduleName);

  var moduleId = project.getModuleId(moduleName);

  console.info('GENERATE ID    ' + moduleId);

  async.waterfall([
    function(callback) {
      var resolved = [moduleHelp.getBaseDepModulePath('', moduleHelp.getBaseModule(moduleName))];
      // 先去循环找到所有的内部模块的依赖，并解析出他的依赖.
      // 把自己加入依赖模块，防止循环依赖.
      that.resolveLocalDeps(moduleName, resolved, function(err, resolvedDeps) {
        callback(err, resolvedDeps.map(function(dep) {

          // 对依赖的模块地址进行还原. 因为在计算整体的依赖的时候，把对应的模块都替换为
          // 相对于base的路径了.
          if (!moduleHelp.isRelative(dep)) return dep;
          return moduleHelp.getRelativeBaseModulePath(moduleName, dep);
        }));
      });
    },

    function(resolvedDeps, callback) {
      // 处理全局模块
      that.resolveGlobalDeps(resolvedDeps, callback);
    },

    function(allDeps, callback) {

      allDeps = resolveDependencies(allDeps, project);
      // 删除自己的依赖.
      allDeps.shift();
      console.log('RESOLVE DEPENDENCIES', '"' + moduleName + '": ', allDeps.join(', '));
      
      allDeps = allDeps.map(function(dep) {
        var ext = path.extname(dep);
        if (ext === '.js') {
          return dep.slice(0, dep.length - 3);
        } else {
          return dep;
        }
      });

      allDeps = _.uniq(allDeps);
      project.moduleDepMapping[moduleId] = allDeps;
      callback();
    }
  ], function() {

    // 加入缓存.
    that.filtered.push(moduleName);
    callback();
  });

  // TODO deps分为两部分，全局模块，我们只需要获取他的依赖即可。可以使用队列，并发执行.
  // TODO 对于parse的模块需要记录，避免循环依赖.
};

// 对计算出来所有的模块再次解析，查看是否有些在其他模块中没有解析的模块需要现在被解析.
// https://github.com/seajs/spm/issues/185
function resolveDependencies(deps, project) {
  return _.uniq(deps.map(function(dep) {
    if (moduleHelp.isRelative(dep)) return dep;

    // 里面包含已经被解析成标准id的模块了。避免找不到依赖提示.
    return project.getGlobalModuleId(dep, true) || dep;
  }));
}

// parse所有依赖
depPlugin.resolveLocalDeps = function(moduleName, resolved, callback) {
  var that = this;
  var deps = this.parseDependencies(moduleName);

  console.log('FOUND DEPENDENCIES', '"' + moduleName + '": ', deps);
  async.forEachSeries(deps, function(depModuleName, callback) {

    // 如果全局模块直接忽略
    if (!moduleHelp.isRelative(depModuleName)) {
      resolved.push(depModuleName);
      callback();
      return;
    }

    // css 模块直接加入依赖，不进行后续处理. seajs 需要检查 deps, 才会处理require
    if (moduleHelp.isRelative(depModuleName) && moduleHelp.isCss(depModuleName)) {
      resolved.push(depModuleName); // 在 css plugin 中会进一步处理.
      callback();
      return;
    }

    // 计算出相对模块基于根目录的模块名称. lib/a.js, ../core/b.js ==> ./core/b.js
    var baseDepModuleName = moduleHelp.getBaseDepModulePath(moduleName, depModuleName);
    baseDepModuleName = moduleHelp.getBaseModule(baseDepModuleName);

    if (resolved.indexOf(baseDepModuleName) > -1) {
        callback();
        return;
    }

    resolved.push(baseDepModuleName);

    // 内部模块
    that.resolveLocalDeps(baseDepModuleName, resolved, function() {
      console.log('resolved------>', baseDepModuleName,
          resolved, depModuleName, moduleHelp.getBaseModule(baseDepModuleName));

      resolved.push(moduleHelp.getBaseModule(baseDepModuleName));
      callback();
    });

  }, function() {
    callback(null, _.uniq(resolved));
  });
};

// 如果配置为false,那么我们只是提醒，然后不会计算他的依赖，只是原封不动，交由页面处理.
//   1. 依赖的模块没有在源中发现。
//   2. 没有配置dependencies

depPlugin.resolveGlobalDeps = function(deps, callback) {
  var project = this.project;
  deps = _.uniq(deps);
  var allDeps = [];
  var globalDeps = [];

  console.log('BEGIN RESOLVE GLOBAL DEPENDENCIES ......', deps.join(','));

  deps.forEach(function(dep) {

    if (dep.indexOf('.') === 0) {
      allDeps.push(dep);
    } else {
      globalDeps.push(dep);
    }
  });

  this.findGlobalModDeps(project, globalDeps, allDeps, function() {
    callback(null, _.uniq(allDeps));
  });
};

// 获取全局模块的依赖.
depPlugin.findGlobalModDeps = function(project, globalDeps, allDeps, callback) {
  var that = this;
  var reservedDeps = project.reservedDeps;
  async.forEachSeries(globalDeps, function(dep, callback) {
    var depId = project.getGlobalModuleId(dep);

    // 如果是保留依赖，不用处理.
    // 如果两者相等，说明也是保留依赖.
    if (reservedDeps.indexOf(dep) > -1 || depId === dep) {
      allDeps.push(depId);
      if (depId === dep && reservedDeps.indexOf(dep) < 0) {
        reservedDeps.push(dep);
      }
      callback();
      return;
    }

    // 获取依赖模块的依赖.
    that.findGlobalModuleDeps(dep, function(deps) {
        [].splice.apply(allDeps, [allDeps.length, 0].concat(deps));
        callback();
    });
  }, function() {
    callback();
  });
};

depPlugin.findGlobalModuleDeps = function(moduleName, callback) {
  var that = this;
  var project = this.project;
  var defineId = project.getGlobalModuleId(moduleName);

  if (this.globalModuleCache[defineId]) {
    console.log('cache ---------------->', defineId);
    callback(this.globalModuleCache[defineId]);
    return;
  }

  // 从源中获取依赖模块的代码.
  console.log('from source getModule:', defineId);
  this.sources.getModule(defineId, function(err, moduleCode) {
    if (err) {
      // fix https://github.com/seajs/spm/issues/192
      var errMsg = 'Cannot find module (' + defineId + ') from sources!';
      if (project.getConfig('throwErrorOnDepNotFound')) {
        throw new Error(err);
      } else {
        console.warn(errMsg);
        that.globalModuleCache[defineId] = defineId;
        callback(defineId);
        return;
      }
    }

    if (moduleHelp.isCss(defineId)) {
      callback([]);
      return;
    }

    var depsMapping = parseMinDepsByModuleCode(defineId, moduleCode);

    var deps = depsMapping.deps;
    deps = changeRelativeToGlobal(depsMapping.defineId, deps);

    // 过滤模块的附属模块，比如 i18n!lang 这类.
    // https://github.com/spmjs/spm/issues/508

    deps = deps.filter(function(dep) {
      return !isAffiliatedMod(dep);
    });

    that.globalModuleCache[defineId] = deps;

    // 缓存全局模块的依赖映射，用户检测依赖冲突.
    project.moduleDepMapping[depsMapping.defineId] = deps;
    callback(deps);
  });
};

// 由于依赖的全局模块中，也存在相对依赖
// 那么我们需要把这些相对依赖给转换成全局依赖.
// 对于非js模块，我们需要在计算完成路径后，回复对应的后缀.
function changeRelativeToGlobal(moduleId, deps) {
  return deps.map(function(dep) {
    if (moduleHelp.isRelative(dep)) {
      var ext = path.extname(dep);

      if (ext) {
        dep = dep.slice(0, dep.indexOf(ext));
      }

      dep = path.join(path.dirname(moduleId), dep);

      if (ext !== '.js') {
        dep = dep + ext;
      }
      return env.normalizePath(dep);
    } else {
      return dep;
    }
  });
}

function parseMinDepsByModuleCode(defineId, moduleCode) {
  var ast = depUtil.getAst(moduleCode);
  var deps = depUtil.parseStatic(ast, defineId) || [];

  if (!deps.length) {
    console.log('模块 ' + defineId + ' 没有找到依赖!');
  }

  // 删除合并模块依赖.
  // fix https://github.com/seajs/spm/issues/206
  var mergeModules = depUtil.parseDefine(ast);

  if (mergeModules.length) {
    deps = changeRelativeToGlobal(defineId, deps);
    deps = deps.filter(function(dep) {
      return mergeModules.indexOf(dep) < 0;
    });
  }

  deps.unshift(defineId);
  return {
    defineId: defineId,
    deps: deps
  };
}

// 检查文件是否是模块文件, 通过define判断.
var defineReg = /define\s*\(\s*function\s*\(\s*require/;
function illegalModule(moduleCode) {
  return !defineReg.test(moduleCode);
}

depPlugin.parseDependencies = function(moduleName, code) {
  if (moduleHelp.isJson(moduleName) || moduleHelp.isVarsModule(moduleName)) {
    return [];
  }

  var deps;
  deps = this.moduleCache.getDeps(moduleName);
  if (deps) return deps;
  
  code = code || this.project.getModuleCode(moduleName);
  var moduleId = this.project.getModuleId(moduleName);
  
  var ast = depUtil.getAst(code);
  
  var allDeps = _.uniq(depUtil.parse(ast, moduleId));
  deps = allDeps.filter(function(dep) {
    return !isTpl(dep);
  });

  // 缓存所有的依赖，dependnecies, 还有代码对应的 ast, 避免重复解析.
  this.moduleCache.add(moduleName, {
    allDeps: allDeps,
    deps: deps,
    ast: ast
  });

  return deps;
};
