var path = require('path');
var util = require('util');

var Rule = require('../rule.js');
var fsExt = require('../../../utils/fs_ext.js');
var moduleHelp = require('../../../utils/module_help.js');

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
  var dependencies = project.dependencies || {};

  if (includes === 'default') {
    includes = [normalize(filename)];
  } else if (util.isArray(includes)) {

    includes = includes.map(function(include) {
      if (isRelative(include)) {
        return normalize(include);
      } else {
        return project.getGlobalModuleId(include, true);
      }
    });
  } else if (includes === '.') {
    var deps = project.getDepMapping(filename) || [];
    var newDeps = [];

    deps.filter(function(dep) {
      if (isRelative(dep)) {
        newDeps.push(normalize(dep));
      }
    });

    newDeps.push(normalize(filename));
    includes = newDeps;
  } else if (includes === '*') {
    var deps = project.getDepMapping(filename);
    var reservedDeps = project.reservedDeps;

    var newDeps = deps.filter(function(dep) {
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
jsRule.jsOutput = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var output = ruleHandler.output;
  var globalExcludes = ruleHandler.globalExcludes;

  var debugCode;
  var code;
  var codeList = [];

  // Fix #248 全局excldes的检查.
  includes = includes.filter(function(include) {
    console.log('----', include, globalExcludes.indexOf(include));
    return  globalExcludes.indexOf(include) < 0;
  });

  // debug 文件处理模块.
  var debugModule = new DebugModule(project);
  async.forEachSeries(includes, function(include, callback) {
    if (/\.css$/.test(include)) {
      callback();
      return;
    }
    if (isRelative(include)) {

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
        var depModule = getDepModule(include, dep);

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

      code = filterIdAndDeps(moduleCode, moduleId, deps);
      code = filterRequire(project, code, '');
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
            code = moduleCode;
            callback();
          });
        }
      ], function() {
        codeList.push(code);
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

function DebugModule(project) {
  this.project = project;
  var debug = project.debugName;
  this.debug = debug ? ('-' + debug) : debug;
  this.codeList = [];
}

DebugModule.prototype.addRelaModule = function(modName, deps, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var that = this;
  var debug = this.debug;
  var project = this.project;
  var modId = project.getModuleId(modName);
  var code = project.getModuleCode(modName);
  var debugModId = modId + this.debug;
  var debugDeps = deps.map(function(dep) {
    if (/\.css$/.test(dep)) {
      return dep;
    }
    return dep + debug;
  });

  // 然后在用这些deps对代码进行替换.
  code = filterIdAndDeps(code, debugModId, debugDeps);
  code = filterRequire(project, code, debug);
  this.codeList.push(code);
  callback();
};

DebugModule.prototype.addGlobalModule = function(modName, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var that = this;
  var project = this.project;
  var debug = this.debug;
  var debugModId = modName + debug;

  project.getGlobalModuleCode(debugModId, function(moduleCode) {
    that.codeList.push(moduleCode);
     callback();
  });
};

DebugModule.prototype.output = function(filename, callback) {
  if (!this.debug) {
     callback();
     return;
  }

  var project = this.project;
  var codes = this.codeList.join('\n\n');
  var debugFilename = filename.replace(/\.js$/, this.debug + '.js');

  fsExt.writeFileSync(debugFilename, codes);
  callback();
};

function filterIdAndDeps(code, moduleId, deps) {
  var defineReg = /define\s*\(\s*(function|{)/;
  code = code.replace(defineReg, function(match, mtype) {
    return 'define("' + moduleId + '", [' + getDepStr(deps) + '], ' + mtype;
  });
  return code;
}

function getDepStr(depList) {
  return depList.length ? '"' + depList.join('", "') + '"' : '';
}

// 对代码文件中依赖的模块，进行替换. 主要是增加debug
function filterRequire(project, code, debug) {
  var modPattern = project.getReqModRegByType('[^\"\']+');
  var asyncModRegCheck = project.getAsyncReqModRegByType('[^\"\']+', false);
  var asyncModReg = project.getAsyncReqModRegByType('[^\"\']+');

  if (asyncModRegCheck.test(code)) {
    code = code.replace(asyncModReg, function(match, sep, mark, depModName) {
      return getRequireByMatch(project, debug, match, sep, mark, depModName, 'require.async');
    });
  }

  return code.replace(modPattern, function(match, sep, mark, depModName) {
    return getRequireByMatch(project, debug, match, sep, mark, depModName, 'require');
  });
}

function getRequireByMatch(project, debug, match, sep, mark, depModName, req) {
  if (/(\.css|\.tpl|\.coffee|\.less)$/.test(depModName)) {
    return match;
  }

  if (isRelative(depModName)) {
    depModName = moduleHelp.getBaseModule(depModName);
    return sep + req + "('" + depModName + debug + "')";
  }

  var globalModuleId = project.getGlobalModuleId(depModName);
  return sep + req + "('" + globalModuleId + debug + "')";
}

/**
 * baseModule: plugins/p1.js
 * depModule: ../a.js
 * ===> ./a.js
 * baseModule: p).js
 * depModule: ./plugins/p1.js
 * ===> ./plugins/p1.js
 * baseModule: p1.js
 * depModule: ./a.js
 * ===> ./a.js;
 */
function getDepModule(baseModule, depModule) {
  return normalize(path.join(path.dirname(baseModule), depModule));
}

module.exports = jsRule;
