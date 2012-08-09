var path = require('path');
var async = require('async');

var Plugin = require('../core/plugin');
var Sources = require('../core/sources.js');
var fsExt = require('../../../utils/fs_ext.js');
var WinOs = require('../../../utils/win_os.js');

// TODO 收集模块的所有依赖信息，然后copy文件到build目录，对于id,不做任何替换。
var deps = module.exports = Plugin.create('dependencies');

deps.param('build', '%buildDirectory%');
deps.param('throwErrorOnDepNotFound', false);

deps.run = function(callback) {
  var that = this;
  var project = this.project;
  this.globalModuleCache = {};

  this.sources = new Sources(true, project);

  // 如果已经解析过依赖.
  this.resolvedModules = {};
  this.filtered = [];

  this.queue = async.queue(function(moduleName, callback) {
    that.parseJs(moduleName, callback);
  }, 1);

  this.queue.drain = function() {
    callback();
  };

  var jsFile = fsExt.list(this.build, /\.js$/).forEach(function(moduleName) {
    that.queue.push(moduleName);
  });
};

// 针对js进行替换.
deps.parseJs = function(moduleName, callback) {
  var that = this;
  var project = this.project;
  var filepath = path.join(this.build, moduleName);
  var moduleCode = fsExt.readFileSync(filepath);

  // 如果在解析依赖的过程中已经处理过
  if (this.filtered.indexOf(moduleName) > -1) {
    callback();
    return;
  }

  if (!isModuleFile(moduleCode)) {
    this.filtered.push(moduleName);
    callback();
    return;
  }

  console.empty();
  console.info('PORCESS MODULE ' + moduleName);

  var moduleId = project.getModuleId(moduleName);

  console.info('GENERATE ID    ' + moduleId);

  var resolvedDeps = [];
  async.waterfall([
    function(callback) {

      // 先去循环找到所有的内部模块的依赖，并解析出他的依赖.
      that.resolveLocalDeps('.', moduleName, resolvedDeps, callback);
    },

    function(resolveDeps, callback) {

      // 处理全局模块
      that.resolveGlobalDeps(resolvedDeps, callback);
    },

    function(allDeps, callback) {

      console.info('RESOLVE DEPENDENCIES', '"' + moduleName + '": ', allDeps.join(','));
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

// parse所有依赖

deps.resolveLocalDeps = function(activeModule, moduleName, resolved, callback) {
  var that = this;
  var project = this.project;
  var moduleCode = project.getModuleCode(moduleName);
  var deps = parseDependencies(moduleCode);

console.info('FOUND DEPENDENCIES', '"' + moduleName + '": ', deps);
  async.forEachSeries(deps, function(depModuleName, callback) {

    // 如果全局模块直接忽略
    if (!isRelative(depModuleName)) {
      resolved.push(depModuleName);
      callback();
      return;
    }

    // 如果是递归过来的模块, 我们需要计算出这个模块相对于activeModule的模块id.
    depModuleName = getRelaModName(activeModule, moduleName, depModuleName);
    if (resolved.indexOf(depModuleName) > -1) {
        callback();
        return;
    }

    // 内部模块
    that.resolveLocalDeps(moduleName, depModuleName, resolved, function() {
//log('resolved------>', depModuleName);
      resolved.push(depModuleName);
      callback();
    });
  }, function() {
    callback(null, unique(resolved));
  });
};

// 根据用户提供的内容，获取相对模块名称.
function getRelaModName(oriMod, parentMod, depMod) {
  return WinOs.normalizePath('./' + path.join(path.dirname(oriMod), path.dirname(parentMod), depMod));
}

deps.resolveGlobalDeps = function(deps, callback) {
  var that = this;
  var project = this.project;
  deps = unique(deps);
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

  async.forEach(globalDeps, function(dep, callback) {
    var depId = project.getGlobalModuleId(dep);

    // 如果相等，表明是保留依赖，不用处理.
    if (depId === dep) {
      allDeps.push(depId);
      callback();
      return;
    }

    if (!depId) {
      throw new Error('Not Found ' + dep + ' dependencies!');
    }

    that.findGlobalModuleDeps(dep, function(deps) {
        [].splice.apply(allDeps, [allDeps.length, 0].concat(deps));
        callback();
    });
  }, function() {
    callback(null, unique(allDeps));
  });
};

deps.findGlobalModuleDeps = function(moduleName, callback) {
  var that = this;
  var defineId = this.project.getGlobalModuleId(moduleName);
  var type = this.project.type;
  var moduleCode;

  if (this.globalModuleCache[defineId]) {
    console.log('cache ---------------->', defineId);
    callback(this.globalModuleCache[defineId]);
    return;
  }

  // 如果依赖的不是核心模块.
  this.sources.getModule(defineId, function(err, moduleCode) {
console.log('getModule:' + defineId);

    if (err) {
      var errMsg = 'Cannot access module (' + defineId + ')!';
      throw new Error(err);
    }

    var depsMapping = depsMapping = parseMinDepsByModuleCode(defineId, moduleCode);

    // 由于用户可能忽略填写#.
    that.project.resetGlobalModuleId(moduleName, depsMapping.defineId);
    var deps = depsMapping.deps;
    deps = changeRelativeToGlobal(depsMapping.defineId, deps);
    that.globalModuleCache[defineId] = deps;
    callback(deps);
  });
};

function changeRelativeToGlobal(moduleId, deps) {
  return deps.map(function(dep) {
    if (isRelative(dep)) {
      if (path.extname(dep) === '.js') {
        dep = dep.slice(0, dep.indexOf('.js'));
      }

      dep = path.join(path.dirname(moduleId), dep);
      console.log('dep-----', dep.replace(new RegExp('\\' + path.sep, "g"), '/'), dep);
      return dep.replace(new RegExp('\\' + path.sep, "g"), '/');
    } else {
      return dep;
    }
  });
}

function parseMinDepsByModuleCode(defineId, moduleCode) {
  defineId = defineId.replace(new RegExp('\\' + path.sep, 'g'), '\\/').replace(/\./g, '\\.');
  var reg = new RegExp('define\\(([\'"])((?:#)?' + defineId + ')\\1,\\s*(\\[[^\\]]*\\])');
  var match = moduleCode.match(reg);
  defineId = match[2];
  var deps = eval(match[3]);

  // 删除合并模块依赖.
  var mergeModules = getMergeModules(moduleCode);
console.log('mergeModules------>', mergeModules)

  if (mergeModules.length) {
    deps = changeRelativeToGlobal(defineId, deps);
//log('deps------>', deps);
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

// 根据模块代码，找到当前代码合并的有那些模块.
function getMergeModules(moduleCode) {
  var defineReg = /define\s*\((['"])([^'"]+)\1\s*,/g;
  var mergeModules = [];
  var match;
  while((match = defineReg.exec(moduleCode)) != null) {
    mergeModules.push(match[2]) 
  }
  return mergeModules;
}

// 检查文件是否是模块文件, 通过define判断.
var defineReg = /define\s*\(\s*function\s*\(\s*require/;
function isModuleFile(moduleCode) {
  return defineReg.test(moduleCode);
}

var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

function parseDependencies(code) {
  var ret = [], match;
  code = removeComments(code);

  while ((match = moduleNamePattern.exec(code))) {
    if (match[2].indexOf('.tpl') < 0 && match[2].indexOf('.css') < 0) {
      ret.push(match[2]);
    }
  }

  return unique(ret);
}

function removeComments(code) {
  return code
    .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/mg, '') // block comments
    .replace(/^\s*\/\/.*$/mg, '') // line comments
}

function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}

function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0;
}

