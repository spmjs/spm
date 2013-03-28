var path = require('path');
var async = require('async');
var util = require('util');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');
var DebugModule = require('./debug_module.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;
var isJs = moduleHelp.isJs;

// 默认合并规则基类.
var jsRule = Rule.createRule('JsMergeRule');

jsRule.check = function(filename, includes) {
  return isJs(filename);
};

jsRule.getIncludes = function(handler, filename, includes, callback) {
  var project = handler.project;
  var build = project.buildDirectory;
  var dependencies = project.dependencies || {};
  var deps, newDeps;

  if (includes === 'default') {
    includes = [normalize(filename)];
  } else if (util.isArray(includes)) {

    includes = includes.map(function(include) {
      if (isRelative(include, build)) {
        return moduleHelp.normalizeRelativeMod(include);
      } else {
        return project.getGlobalModuleId(include, true);
      }
    });
  } else if (includes === '.') {
    deps = project.getDepMapping(filename) || [];
    newDeps = [];

    deps.filter(function(dep) {
      if (isRelative(dep)) {
        newDeps.push(normalize(dep));
      }
    });

    newDeps.push(normalize(filename));
    includes = newDeps;
  } else if (includes === '*') {
    deps = project.getDepMapping(filename);
    var reservedDeps = project.reservedDeps;

    newDeps = deps.filter(function(dep) {
      if (isRelative(dep)) {
        return true;
      }

      // 保留依赖.
      if (reservedDeps.indexOf(dep) > -1) {
        return false;
      }
      return true;
    });

    newDeps = newDeps.map(function(dep) {
      if (isRelative(dep)) {
        return normalize(dep);
      } else {
        return dep;
      }
    });
    newDeps.push(filename);
    includes = newDeps;
  } else {
    throw new Error('Parse js merge rule [' + includes + '] error!');
  }

  callback(includes);
};

// js合并在输出之前，会进行规整，所以统一成一个函数即可.
jsRule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var output = ruleHandler.output;
  var globalExcludes = ruleHandler.globalExcludes;

  var debugCode;
  var code;
  var codeList = [];

  // Fix #248 全局excldes的检查.
  includes = includes.filter(function(include) {
    console.log('----', include, globalExcludes.indexOf(include));
    return globalExcludes.indexOf(include) < 0;
  });

  // debug 文件处理模块.
  var debugModule = new DebugModule(project);
  async.forEachSeries(includes, function(include, callback) {
    if (/\.css$/.test(include)) {
      callback();
      return;
    }
    if (isRelative(include)) {

      if (moduleHelp.isVarsModule(include)) {
        callback();
        return;
      }

      // getBaseDepModulePath 这个方法会对相对依赖的模块相对于根目录重新定位.
      include = moduleHelp.getBaseDepModulePath(filename, include);
      var moduleCode = project.getModuleCode(include);
      var moduleId = project.getModuleId(include);

      // 获取此模块的依赖关系，然后准备检查依赖的相对模块是否存在与输出列表中.
      var deps = project.getDepMapping(include) || [];
      var depsCheck = deps.slice(0);

      // 我们先收集所依赖模块中存在的合并模块，然后统一删除.
      var allMergedMods = [];
      var dep;
      while (dep = depsCheck.pop()) {
        if (!isRelative(dep)) {
          continue;
        }
        var depModule = moduleHelp.getDepModule(include, dep);

        // 把需要清除的模块统一收集起来.
        // TODO TEST 需要考虑循环依赖的话，可能把模块都删除掉.
        if (ruleHandler.hasOutput(depModule)) {
          var mergedModules = output[depModule].filter(function(mod) {
            return mod !== depModule;
          });
          [].splice.apply(allMergedMods, [allMergedMods, 0].concat(mergedModules));
        }
      }
      moduleHelp.unique(allMergedMods);

      // 开始统一从dep中删除合并依赖模块.
      deps = deps.filter(function(dep) {
        return allMergedMods.indexOf(normalize(dep)) < 0;
      });

      // 如果包含合法的 define 才进行替换
      if (!moduleHelp.hasDefine(moduleCode, true)) {
        console.warn('发现非 cmd 模块 ' + moduleId);
        code = moduleCode;
        // 非 cmd 模块只提出警告, 但是继续打包合并.
      } else {
        code = moduleHelp.filterIdAndDeps(moduleCode, moduleId, deps);
        code = moduleHelp.filterRequire(project, code, '');
      }

      codeList.push(code);

      debugModule.addRelaModule(include, deps, function() {
        callback();
      });

    } else {
      async.series([
        function(callback) {
          debugModule.addGlobalModule(include, function() {
            callback();
          });
        }, function(callback) {
          project.getGlobalModuleCode(include, function(moduleCode) {
            codeList.push(moduleCode);
            callback();
          });
        }
      ], function() {
        callback();
      });
    }

  }, function() {
    var codes = codeList.join('\n\n');

    var moduleFile = path.join(project.distDirectory, filename);
    fsExt.writeFileSync(moduleFile, codes);

    debugModule.output(moduleFile, function() {
      callback();
    });
  });
};

module.exports = jsRule;
