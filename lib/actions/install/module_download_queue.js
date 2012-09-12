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
var baseDir = process.cwd();

function MDQueue(withDebug) {
  // 首先构建出模块基本信息，
  // 然后需要设置目前的module是基于命令行还是基于目录的模块.
  this.debug = withDebug || 'debug'; 

  var globalHome = path.join(home, '.spm');
  var globalConfig = path.join(globalHome, SPM_CONFIG);

  if (!fsExt.existsSync(globalConfig)) {
    createGLobalConfig(globalHome); 
  }

  var config = JSON.parse(fsExt.readFileSync(globalConfig));
  if (!config.sources) {
    throw new Error('not found sources config!');
  }

  config.sources = perfectSources(config.sources);

  this.sources = new Sources(config);

  this.queue = async.queue(function(modId, callback) {
    this.download(modId, callback); 
  }.bind(this), 10);

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

    if (this.downloaded.indexOf(mod) > -1) {
      return;
    }

    this.queue.push(mod);
  },
  download: function(modId, cb) {
    this.downloaded.push(modId);

    async.series([
      function(callback) {
        this.sources.getModule(modId, function(code) {
          this.parseDeps(modId, code);
          this.output(modId, code); 
        }.bind(this))
      }, 
      function(callback) {
        if (!this.debug) {
          callback();
          return;
        }
        var dModId = modId + '-' + this.debug;
        this.sources.getModule(dModId, function(code) {
          this.output(dModId, code); 
        }.bind(this))
      }
    ], function() {
      cb();
    });
  },

  parseDeps: function(modId, code) {
    var deps = parseMinDepsByModuleCode(modId, code);
    deps = changeRelativeToGlobal(modId, deps);
console.info('deps----->', deps);
    deps.forEach(deps, function(dep) {
      this.add(dep); 
    }.bind(this));
  },

  output: function(modId, code) {
    var modInfo = Sources.moduleIdParse(modId);
    var modPath = path.join(baseDir, modInfo.filepath);
console.info('output----->', modPath);
    //fsExt.writeFileSync(modPath, code);
  }

};

function parseMinDepsByModuleCode(moduleId, code) {
  var reg = new RegExp('define\\(([\'"])((?:#)?' + moduleId + ')\\1,\\s*(\\[[^\\]]*\\])');
  var match = code.match(reg);
  return eval(match[3]);
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
