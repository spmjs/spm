// 源文件copy, 把源文件copy到工作目录。
// 后续可以支持filter功能，可以针对指定的文件进行过滤和替换

// TODO 过滤和基本的项目信息替换.
// TODO ID, require, dependencies替换.

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
      console.log('');
      console.log('  Successfully execute plugin resources!');
      console.log('');
      callback();
  });
};

function ModuleHandler(project, deps, callback) {
  var that = this;
  this.project = project;
  this.deps = deps;
  this.src = project.srcDirectory;
  this.build = project.buildDirectory;

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
  if (isDirectory(filepath)) {
    fs.readdirSync(filepath).forEach(function(filename) {
      that.filter(path.join(filepath, filename));
    });
  } else if (isFile(filepath)) {
    this.queue.push(filepath);
  }
};

// 针对js进行替换.
ModuleHandler.prototype.filterJs = function(filepath, callback) {
  var that = this;
  var moduleCode = fsExt.readFileSync(filepath); 
  var filename = path.basename(filepath);

  // 如果在解析依赖的过程中已经处理过
  if (this.filtered.indexOf(filename) > -1) {
    callback();
  }
  var relaDir = path.relative(this.src, filepath);
  log('PORCESS MODULE ' + relaDir);

  var moduleId = this.project.getModuleId(filename);

  log("GENERATE ID    " + moduleId);
  var deps = parseDependencies(moduleCode);

  log('FOUND DEPENDENCIES', '"' + filename + '": ', deps);
  var resolvedDeps = [];
  async.waterfall([
    function(callback) {

      // 先去循环找到所有的内部模块的依赖，并解析出他的依赖.
      that.resolveLocalDeps(null, filepath, resolvedDeps, callback);
    },
    function(resolveDeps, callback) {
      
      // 处理全局模块
      that.resolveGlobalDeps(resolvedDeps, callback);
    },
    function(allDeps, callback) {

      log('RESOLVE DEPENDENCIES', '"' + filename + '": ', allDeps);
      var allDebugDeps = allDeps.map(function(dep) {
        return dep + '-debug';
      });
      //that.replace(filepath, moduleId, allDeps, callback);
      that.replace(filepath, moduleId + '-debug', allDebugDeps, callback);
    }
  ], function() {
    
    // 加入缓存.
    that.filtered.push(filename);
    callback();
  });
  // TODO deps分为两部分，全局模块，我们只需要获取他的依赖即可。可以使用队列，并发执行.
  // TODO 对于parse的模块需要记录，避免循环依赖.

};

// parse所有依赖
ModuleHandler.prototype.resolveLocalDeps = function(basePath, filepath, resolved, callback) {
  var that = this;
  var moduleCode = fsExt.readFileSync(filepath); 
  var deps = parseDependencies(moduleCode);
//console.log('resolveLocalDeps------>', modulePath, basePath, deps, resolved);
  async.forEachSeries(deps, function(depModuleName, callback) {

    if (resolved.indexOf(depModuleName) > -1) {
        callback();
        return;
    }
    if (isRelative(depModuleName)) {
      var depFilepath = path.join(path.dirname(filepath), depModuleName) + '.js';
      // 内部模块
      that.resolveLocalDeps(that.getBasepath(filepath, depFilepath), depFilepath, resolved, function() {
        if (basePath) {
          depModuleName = path.relative(basePath, depModuleName);
        }
        if (!isRelative(depModuleName)) {
          depModuleName = './' + depModuleName;
        }
        resolved.push(depModuleName);
        callback();
      });
    } else {
      resolved.push(depModuleName); 
      callback();
    } 
  }, function() {
    callback(null, unique(resolved));
  });
};
ModuleHandler.prototype.getBasepath = function(baseFilepath, depFilepath) {
  var r1 = path.relative(baseFilepath, this.src);
  var r2 = path.relative(depFilepath, this.src);
  return path.relative(r1, r2); 
};

ModuleHandler.prototype.resolveGlobalDeps = function(deps, callback) {
  log('BEGIN FiLTER ID AND REQUIRE AND DEPENDENCIES......', deps);
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
    // 对于此依赖，不用处理.
    if (depId === dep) {
      allDeps.push(depId);
      callback();
      return;
    }

    if (!depId) {
      throw new Error ('Not Found ' + dep + ' moduleDependencies!');
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

  // 如果依赖的不是核心模块.
  
  this.sources.getModule(defineId, true, function(err, moduleCode) {
    if (err) {
      var errMsg = 'Cannot access module (' + globalId + ')!';
      throw new Error(err);
    }
    var depsMapping = parseDepsByModuleCode(defineId, moduleCode);

    // 由于用户可能忽略填写#.
    that.project.resetGlobalModuleId(moduleName, depsMapping.defineId);
    callback(depsMapping.deps); 
  });
};

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
      deps.unshift(defineId);
      depsMapping.defineId = stat[1][2][0][1];
      depsMapping.deps = deps;
      return stat;
    }
  });
  return depsMapping;
}

ModuleHandler.prototype.replace = function(filepath, moduleId, allDeps, callback) {
  var relaDir = path.relative(this.src, filepath);

  relaDir = relaDir.slice(0, relaDir.indexOf('.js')) + '-debug.js';
  
  var moduleCode = fsExt.readFileSync(filepath); 
  moduleCode = filterIdAndDeps(moduleCode, moduleId, getDepStr(allDeps));
  moduleCode = filterGlobalRequire(moduleCode, this.project);
  fsExt.writeFileSync(path.join(this.build, relaDir), moduleCode);
  callback && callback();
};

// 直接输出文件到工作目录.
ModuleHandler.prototype.copy = function(filepath, callback) {
  var relaDir = path.relative(this.src, filepath);
  log( 'COPY FILE ' + relaDir);
  var moduleCode = fsExt.readFileSync(filepath); 
  fsExt.writeFileSync(path.join(this.build, relaDir), moduleCode);
  callback();
}

function isJs(filepath) {
  var filename = path.basename(filepath);
  return filename.lastIndexOf('.js') === (filename.length - 3);
}

function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory();
}

function isFile(filepath) {
  return fs.statSync(filepath).isFile();
}

function filterModule(file, project, deps) {

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

function log() {
  console.log.apply(console, ['>>> '].concat([].slice.call(arguments)));
}

function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}

function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0
}

