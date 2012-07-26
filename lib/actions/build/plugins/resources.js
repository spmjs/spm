// 源文件copy, 把源文件copy到工作目录。
// 后续可以支持filter功能，可以针对指定的文件进行过滤和替换

// TODO 过滤和基本的项目信息替换.
// TODO ID, require, dependencies替换.
// TODO 收集模块的所有依赖信息，然后copy文件到build目录，对于id,不做任何替换。

var fs = require('fs');
var path = require('path');
var async = require('async');

var astParser = require('uglify-js').parser;
var Ast = require('../../../utils/ast.js');
var Sources = require('../core/sources.js');
var fsExt = require('../../../utils/fs_ext.js');


/**
 * 根据项目不同的类型，可能有基本不同的过滤规则。
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {
  // TODO 对于js 我们需要把id, require, deps替换后，放入到build目录，后续可以添加自定一个替换规则.
  // TODO css, tpl 直接输出.
  var deps; // = new Depedency(project);

  new ModuleHandler(project, deps, function() {
// console.log(project.moduleDepMapping)
    console.info('');
    console.info(' The plugin resources completed successfully!');
    console.info('');
    callback();
  });
};

function ModuleHandler(project, deps, callback) {
  var that = this;
  this.project = project;
  this.deps = deps;
  this.src = project.srcDirectory;
  this.build = project.buildDirectory;
  this.globalModuleCache = {};

  this.sources = new Sources(true, project);


  // 如果已经解析过依赖.
  this.resolvedModules = {};
  this.filtered = [];

  this.queue = async.queue(function(filepath, callback) {
    if (isJs(filepath)) {
      that.filterJs(filepath, callback);
    } else {
      that.copy(filepath, callback);
    }
  }, 1);
  this.queue.drain = function() {
    callback();
  };

  this.filter(this.src);
}

ModuleHandler.prototype.filter = function(filepath) {
  var that = this;
  if (fsExt.isDirectory(filepath)) {
    fs.readdirSync(filepath).forEach(function(filename) {
      that.filter(path.join(filepath, filename));
    });
  } else if (fsExt.isFile(filepath)) {
    this.queue.push(filepath);
  }
};

// 针对js进行替换.
ModuleHandler.prototype.filterJs = function(filepath, callback) {
  var that = this;
  var project = this.project;
  var moduleCode = fsExt.readFileSync(filepath);
  var moduleFile = path.relative(this.src, filepath);

  // 如果在解析依赖的过程中已经处理过
  if (this.filtered.indexOf(moduleFile) > -1) {
    callback();
    return;
  }

  if (!isModuleFile(moduleCode)) {
    this.filtered.push(moduleFile);
    this.copy(filepath, callback);
    return;
  }

  console.info('PORCESS MODULE ' + moduleFile);

  var moduleId = project.getModuleId(moduleFile);

  console.info('GENERATE ID    ' + moduleId);

  var resolvedDeps = [];
  async.waterfall([
    function(callback) {

      // 先去循环找到所有的内部模块的依赖，并解析出他的依赖.
      that.resolveLocalDeps('.', moduleFile, resolvedDeps, callback);
    },
    function(resolveDeps, callback) {

      // 处理全局模块
      that.resolveGlobalDeps(resolvedDeps, callback);
    },
    function(allDeps, callback) {

      console.info('RESOLVE DEPENDENCIES', '"' + moduleFile + '": ', allDeps.join(','));
      project.moduleDepMapping[moduleId] = allDeps;
      that.copy(filepath, callback);

      // that.replace(filepath, moduleId, allDeps, callback);
    }
  ], function() {

    // 加入缓存.
    that.filtered.push(moduleFile);
    callback();
  });

  // TODO deps分为两部分，全局模块，我们只需要获取他的依赖即可。可以使用队列，并发执行.
  // TODO 对于parse的模块需要记录，避免循环依赖.
};

// parse所有依赖
ModuleHandler.prototype.resolveLocalDeps = function(activeModule, moduleName, resolved, callback) {
  var that = this;
  var project = this.project;
  var moduleCode = project.getSrcModuleCode(normalize(moduleName));
  var deps = parseDependencies(moduleCode);

//log('FOUND DEPENDENCIES', '"' + moduleName + '": ', deps);
  async.forEachSeries(deps, function(depModuleName, callback) {

    // 如果全局模块直接忽略
    if (!isRelative(depModuleName)) {
      resolved.push(depModuleName);
      callback();
      return;
    }

    // 如果是递归过来的模块, 我们需要计算出这个模块相对于activeModule的模块id.
    if (activeModule) {
      depModuleName = './' + path.join(path.dirname(activeModule), path.dirname(moduleName), depModuleName);
    }
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

function getDepModule(baseModule, depModule) {
  return normalize(path.join(path.dirname(baseModule), depModule));
}

function normalize(module) {
  module = path.normalize(module);
  if (path.extname(module) !== '.js') {
    module += '.js';
  }
  return module;
}

ModuleHandler.prototype.getBasepath = function(baseFilepath, depFilepath) {
  var r1 = path.relative(baseFilepath, this.src);
  var r2 = path.relative(depFilepath, this.src);
  return path.relative(r2, r1);
};

ModuleHandler.prototype.resolveGlobalDeps = function(deps, callback) {
  deps = unique(deps);
  console.info('BEGIN RESOLVE GLOBAL DEPENDENCIES ......', deps.join(','));
  var that = this;
  var project = this.project;
  var allDeps = [];
  var globalDeps = [];
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

ModuleHandler.prototype.findGlobalModuleDeps = function(moduleName, callback) {
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
    if (err) {
      var errMsg = 'Cannot access module (' + globalId + ')!';
      throw new Error(err);
    }
    var depsMapping;
    if (defineId.indexOf('-debug') < 0) {
      depsMapping = parseMinDepsByModuleCode(defineId, moduleCode);
    } else {
      depsMapping = parseDepsByModuleCode(defineId, moduleCode);
    }

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
      return path.join(path.dirname(moduleId), dep);
    } else {
      return dep;
    }
  });
}

function parseMinDepsByModuleCode(defineId, moduleCode) {
  defineId = defineId.replace(/\//g, '\\/').replace(/\./g, '\\.');
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

function parseDepsByModuleCode(defineId, moduleCode) {
  var ast = astParser.parse(moduleCode);
  var depsMapping = {};
  var deps = [];
  Ast.walk(ast, 'stat', function(stat) {

    if (stat.toString().indexOf('stat,call,name,define,string,') !== 0) {

      return stat;
    } else if (stat.toString().indexOf(defineId) < 0) {

       return stat;
    } else {
      //[ 'stat', [ 'call', [ 'name', 'define' ],
      //    [ [Object], [Object], [Object] ] ] ]
      var depsArr = stat[1][2][1][1];
      depsArr.forEach(function(dep) {
        deps.push(dep[1]);
      });
      depsMapping.defineId = stat[1][2][0][1];
      deps.unshift(depsMapping.defineId);
      depsMapping.deps = deps;
      return stat;
    }
  });
  return depsMapping;
}

ModuleHandler.prototype.replace = function(filepath, moduleId, allDeps, callback) {
  var project = this.project;
  var relaDir = path.relative(this.src, filepath);
  var moduleCode = fsExt.readFileSync(filepath);

  moduleCode = filterIdAndDeps(moduleCode, moduleId, getDepStr(allDeps));
  moduleCode = filterGlobalRequire(moduleCode, project);
  moduleCode = filterTplRequire(filepath, moduleCode, project);
  moduleCode = filterCssRequire(moduleCode);

  fsExt.writeFileSync(path.join(this.build, relaDir), moduleCode);
  callback && callback();
};

// 直接输出文件到工作目录.
ModuleHandler.prototype.copy = function(filepath, callback) {
  var relaDir = path.relative(this.src, filepath);
  console.info('COPY FILE ' + relaDir);
  var moduleCode = fsExt.readFileSync(filepath);
  fsExt.writeFileSync(path.join(this.build, relaDir), moduleCode);
  callback();
};

function isJs(filepath) {
  return path.extname(filepath) === '.js';
}

// 检查文件是否是模块文件, 通过define判断.
var defineReg = /define\s*\(\s*function\s*\(\s*require/;
function isModuleFile(moduleCode) {
  return defineReg.test(moduleCode);
}

function getDepStr(depList) {
  return depList.length ? '"' + depList.join('", "') + '"' : '';
}

function filterIdAndDeps(code, moduleId, deps) {
  return code.replace('define(function',
      'define("' + moduleId + '", [' + deps + '], function');
}

function filterGlobalRequire(code, project) {
  var modPattern = getReqModRegByType('[-\\w$]+');
  return code.replace(modPattern, function(match, mark, depModName) {
    return ' require("' + project.getGlobalModuleId(depModName) + '")';
  });
}

var spacePattern = /^[\s\t]*|[\s\t]$/gm;
function filterTplRequire(filepath, code, project) {
  if (!argv.tpl) {
    return;
  }
  var tplModPattern = getReqModRegByType('[^\"\']+\\.tpl');
  return code.replace(tplModPattern, function(match, mark, depModName) {
    var tplFilepath = project.getDepModulePath(filepath, depModName);
    var tplCode = fsExt.readFileSync(tplFilepath);
    tplCode = tplCode.replace(/'/g, '"');
    tplCode = tplCode.replace(spacePattern, '');
    return "'" + tplCode.split('\n').join('') + "'";
  });
}

function filterCssRequire(code) {
  return code;
}

/**
 * 获取指定类型的正则.
 * @param {String} moduleType 具体模块类型正则.
 * @return {RegExp} 返回对应类型正则.
 */
function getReqModRegByType(moduleType) {
  return new RegExp('(?:^|[^.])\\brequire\\s*\\(\\s*(["\'])(' +
      moduleType + ')\\1\\s*\\)', 'g');
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

function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0;
}

