'use strict';

// 根据一个模块下载相关依赖，会迭代进行.
// 默认不下载 debug文件.
var async = require('async');
var path = require('path');

var env = require('../../utils/env.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');
var Sources = require('../../core/sources.js');
var SPM_CONFIG = 'config.json';
var home = env.home;
var baseDir;

function MDQueue(withDebug, to, callback) {
  // 首先构建出模块基本信息，
  // 然后需要设置目前的module是基于命令行还是基于目录的模块.
  this.debug = withDebug || 'debug'; 
  baseDir = to;
 
  this.queue = async.queue(function(modId, callback) {
    if (this.downloaded.indexOf(modId) > -1) {
      callback();
      return;
    }
    this.download(modId, callback); 
  }.bind(this), 1);

  this.queue.drain = function() {
    callback(); 
  };

  this.downloaded = [];
}

MDQueue.prototype = {
  add: function(mod) {
    if (mod.indexOf('#') === 0) {
      mod = mod.slice(1);
    }
    this.queue.push(mod);
  },

  download: function(modId, cb) {

    if (!this.sources) {
      throw new Error('not found sources config!');
    }

    var that = this;
    this.downloaded.push(modId);
    console.log('begin to download module:', modId)
    
    that.sources.getSourceModule(modId, function(err, _modId, filePath) {
      if (!filePath) {
        console.warn('download module ' + _modId + ' error!');
        cb();
        return;
      }

      var codeDir = path.dirname(filePath);
      var modInfo = Sources.moduleIdParse(modId);
      var to = path.join(baseDir, modInfo.modulePath);
      
      fsExt.mkdirS(to);
      fsExt.copydirSync(codeDir, to);

      console.info('downloaded module ' + _modId + ' to ' + to);
      
      var code = fsExt.readFileSync(path.join(baseDir, modInfo.filepath))
      that.parseDeps(modId, code);
      
      cb();
    });
  },

  parseDeps: function(modId, code) {
    var that = this;
    var depIds = parseMinDepsByModuleCode(modId, code);

    var deps = depIds.deps;
    depIds.downloaded.forEach(function(mid) {
      if (moduleHelp.isRelative(mid)) {
        return;
      }
      if (mid.indexOf('#') === 0) {
        mid = mid.slice(1);
      }
      if (that.downloaded.indexOf(mid) < 0) {
        that.downloaded.push(mid);
      }
    });

    deps.forEach(function(dep) {
      this.add(dep); 
    }.bind(this));
  },

  setSources: function(sources) {
    this.sources = sources;
  },

  setTo: function(to) {
    this.to = baseDir = to;
  }
};

function parseMinDepsByModuleCode(moduleId, code) {
  var reg = new RegExp('define\\(([\'"])((?:#)?' + moduleId + ')\\1,\\s*(\\[[^\\]]*\\])');
  var match = code.match(reg);
  if (!match) {
    return {
      deps: [],
      downloaded: []
    }
  }

  var deps = eval(match[3]);

  deps = deps.filter(function(dep) {
    return !moduleHelp.isRelative(dep) && !moduleHelp.isVarsModule(dep);
  });

  // deps = changeRelativeToGlobal(moduleId, deps);
  var mergeModules = getMergeModules(code) || [];
 
  return {
    deps: deps,
    downloaded: mergeModules
  }
}

// 根据模块代码，找到当前代码合并的有那些模块.
function getMergeModules(moduleCode) {
  var defineReg = /define\s*\((['"])([^'"]+)\1\s*,/g;
  var mergeModules = [];
  var match;
  while ((match = defineReg.exec(moduleCode)) != null) {
    mergeModules.push(match[2]);
  }
  return mergeModules;
}

// 由于依赖的全局模块中，也存在相对依赖
// 那么我们需要把这些相对依赖给转换成全局依赖.
function changeRelativeToGlobal(moduleId, deps) {
  return deps.map(function(dep) {
    if (moduleHelp.isRelative(dep)) {
      if (path.extname(dep) === '.js') {
        dep = dep.slice(0, dep.indexOf('.js'));
      }

      dep = path.join(path.dirname(moduleId), dep);
      return env.normalizePath(dep);
    } else {
      return dep;
    }
  });
}

// 如果用户没有配置~/.spm/config.json,自动替用户创建.
function createGlobalConfig(globalHome) {
  var tplConfigDir = path.join(path.dirname(module.filename), '../../help/');
  fsExt.mkdirS(globalHome);
  fsExt.copyFileSync(tplConfigDir, globalHome, SPM_CONFIG);
  console.info('success create global config.json to ' + globalHome);
}

function perfectSources(sources) {
  sources = sources || [];
  return sources.map(function(source) {
    if (moduleHelp.isLocalPath(source)) {
      source = perfectLocalPath(source);
    } else {
      if (source.indexOf('http') !== 0) {
        source = 'http://' + source;
      }
    }
    return source;
  });
};

module.exports = MDQueue;
