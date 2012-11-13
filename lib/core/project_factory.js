// 项目分析模块

var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var StringUtil = require('../utils/string.js');

var help = require('../utils/module_help.js');
var Sources = require('./sources.js');
var ConfigParse = require('./config_parse.js');
var Dependency = require('./dependency.js');
var PluginConfig = require('./plugin_config.js');
var isRelative = help.isRelative;
var perfectLocalPath = help.perfectLocalPath;

var SPM_CONFIG = 'config.json';
var CONFIG = 'package.json';
var DEBUG = 'debug';
var ACTION = 'build';
var home = env.home;

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 当前action.
 * @param {Object} mod  模块基本信息 or 模块目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = action;
  } 

  if (arguments.length === 3) {
    ACTION = action;
  }

  // 首先构建出模块基本信息，
  // 然后需要设置目前的module是基于命令行还是基于目录的模块.
  var modConfig = new ConfigParse();

  var globalHome = path.join(home, '.spm');
  modConfig.set('globalHome', globalHome);

  var baseDirectory = options.getConfig('base') || process.cwd();

  // 允许用户设置配置基本信息.
  var baseModInfo = options.getConfig('baseModInfo');
  if (baseModInfo) {
    Object.keys(baseModInfo).forEach(function(key) {
      modConfig.set(key, baseModInfo[key]);
    });
    delete options.baseModInfo;
  } 

  // 增加parent解析规则.
  modConfig.addParseRule('parent', function(value, filepath) {
    if (filepath.indexOf('http') === 0) {
      this.addUrl(value, filepath, true);
    } else {
      this.addFile(value, path.dirname(filepath), true);
    }
  });

  // 增加 spmConfig 解析. 主要解析"*"
  modConfig.addParseRule('spmConfig', function(value) {
    var allConfig = {};

    Object.keys(value).forEach(function(key) {
      var val = value[key];

      if (key === '*') {
        Object.keys(val).forEach(function(subKey) {
          var subVal = val[subKey];
          allConfig[subKey] = subVal;
        });
        delete value[key];
      }
    });

    // 给当前 actionConfig 增加默认配置，否则无法注册公用配置.
    value[action] = value[action] || {};

    if (Object.keys(allConfig).length > 0) {
      Object.keys(value).forEach(function(key) {
        var val = value[key];
        Object.keys(allConfig).forEach(function(subKey) {
          var subVal = allConfig[subKey];

          if (typeof val[subKey] === 'undefined') {
            val[subKey] = subVal;
          } 
        });
      });
    }

    modConfig.removeParseRule('spmConfig');
    modConfig.set('spmConfig', value);
  });
  

  // 设置模块基本信息.
  var baseConfig = path.join(baseDirectory, CONFIG);
  if (fsExt.existsSync(baseConfig)) {
    modConfig.addFile(baseConfig);
    modConfig.set('isModule', true);
  }

  // 设置用户传入配置信息.
  var gc = options.getConfig('global-config');
  if (gc) {
    gc = perfectLocalPath(gc);
    modConfig.addFile(gc);
  }

  // 设置全局配置信息.
  var globalConfig = path.join(globalHome, SPM_CONFIG);
  if (!fsExt.existsSync(globalConfig)) {
    createGlobalConfig(globalHome);
  }
  modConfig.addFile(globalConfig);

  if (modConfig.isEnd()) {
     new Project(options, modConfig, callback);
  } else {
    modConfig.once('end', function(config) {
      new Project(options, modConfig, callback);
    });
  }
};

// 如果用户没有配置~/.spm/config.json,自动替用户创建.
function createGlobalConfig(globalHome) {
  var tplConfigDir = path.join(path.dirname(module.filename), '../help/');
  fsExt.mkdirS(globalHome);
  fsExt.copyFileSync(tplConfigDir, globalHome, SPM_CONFIG);
  console.info('success create global config.json to ' + globalHome);
}

//项目基类，里面将封转一些常用的方法.
function Project(options, modConfig, callback) {
  var that = this;
  this.modConfig = modConfig;
  this.options = options;
  this._initGlobalInfo(modConfig.get());

  // 查找那些是保留依赖.
  this.moduleSources = new Sources(this);

  async.series([
    function(cb) {
      PluginConfig.initUserPlugins(that, cb);
    },
    function(cb) {
      /**
      Dependency.init(that, function(dependencyNode) {
        that.rootNode = dependencyNode;
        cb();
      });
      **/
      cb();
    }
  ], function() {
    callback(that);
  });
}

Project.prototype = {

  // 初始化项目的一些全局信息.
  _initGlobalInfo: function(modConfig) {
    Project.prototype.__proto__ = modConfig;
    var baseDir = this.baseDirectory = this.baseDirectory ||
        this.getConfig('base');

    // 目前模块名称是通过配置获取.
    this.version = this.version || this.getConfig('version') || '';
    this.dependencies = this.dependencies || {};
    this.moduleDepMapping = {};

    // 整个项目所有的依赖. 主要是用来对比检测注释中的依赖.
    this.allGlobalDeps = [];
    this.plugins = this.plugins || {};
    this._parseSrcAndName();
    normalizeDeps(this.dependencies);
    this._initSources();

    var source = this.getSource();

    // 如果是本地源.
    if (help.isLocalPath(source)) {
      this.baseSourcePath = source;
    } else {
      this.baseSourcePath = path.join(this.globalHome, 'sources',
        help.getHost(source));
    }

    this._initDist();

    this.buildDirectory = this.buildDirectory || this.getConfig('build') ||
        path.join(baseDir, '_build');

    this._initDebugName();
    this.type = this.type || this._getProjectType();
    this._initReservedDeps();
    this._initOutput();
  },

  _parseSrcAndName: function() {
    var src = this.getConfig('src');
    var sourceFiles = this.getConfig('source-files');

    if (util.isArray(sourceFiles) && sourceFiles.length === 1) {
      sourceFiles = sourceFiles[0];
    }

    if (sourceFiles && !util.isArray(sourceFiles) &&
            fsExt.isDirectory(perfectLocalPath(sourceFiles))) {

      // src 优先级最高.
      src = src || sourceFiles;
    }

    var name = this.name || this.getConfig('name');

    if (src) {
      src = perfectLocalPath(src);

      if (!name) {
        // 对于没有配置文件，通过命令行配置源文件目录的，使用源文件根目录
        name = path.basename(src);
      }

    } else {

      // 使用默认的 src 目录查找
      src = path.join(this.baseDirectory, 'src');
    }

    if (!name) {

      // 如果没有解析出name, 使用当前目录作为默认的name.
      name = path.basename(this.baseDirectory);
    }

    this.name = name;
    this.srcDirectory = src;
  },

  _initDist: function() {
    var to = null;

    // TODO deploy 的 to 和 build 的 to 有冲突，目前硬编码.
    if (ACTION !== 'deploy') {
      to = this.getConfig('to');
    }

    this.distDirectory = this.distDirectory || to ||
        path.join(this.baseDirectory, 'dist');
  },

  _initOutput: function() {
    this.output = this.output || this.getConfig('output');
    var defaultModName = this.name + '.' + this.type; 

    if (!this.output) {
      var hasDefaultModule = fsExt.list(this.srcDirectory).some(function(mod) {
        return mod == defaultModName; 
      });

      if (hasDefaultModule) {
        this.output = {};
        this.output[defaultModName] = '.';
        console.warn('create default output config (' + JSON.stringify(this.output) + ')');
      } else {
        if (this.isModule) {
          // throw new Error('Not found output config!');
          console.warn('Not found output config!');
        }
        // console.info('---->', this.baseDirectory)
        this.output = {};
      }
    }
  },

  _initDebugName: function() {
    this.debugName = this.debugName;

    if (typeof this.debugName === 'undefined') {
      this.debugName = this.getConfig('with-debug');
    }
  },

  // 获取项目source.由于可能有多个数据源.
  getSource: function() {
    if (this.sources.length === 0) {
      console.warn(this.name + ' not found available source!');
      return '';
    }
    return this.sources[0];
  },

  _initSources: function() {
    this.sources = this.getConfig('source') || this.sources || [];
    this._perfectSources();
  },

  _perfectSources: function() {
    if (typeof this.sources === 'string') {
      this.sources = [this.sources];
    }

    this.sources = this.sources.map(function(source) {
      if (help.isLocalPath(source)) {
        source = perfectLocalPath(source);
      } else {
        if (source.indexOf('http') !== 0) {
          source = 'http://' + source;
        }
      }
      return source;
    });
  },

  // 用户可以配置某些模块到页面在去解析.
  _initReservedDeps: function() {
    this.reservedDeps = getReservedDeps(this.dependencies);
  },

  // 获取项目类型，默认只要项目里面包含js,则为 js项目.
  _getProjectType: function() {
    var srcDirectory = this.srcDirectory;
    if (!fsExt.existsSync(srcDirectory)) {
      return 'js';
    }

    var files = fsExt.list(srcDirectory);
    var isJs = files.some(function(filename) {
      return path.extname(filename) === '.js';
    });
    return isJs ? 'js' : 'css';
  },

  // 获取指定模块的依赖关系.
  getDepMapping: function(moduleName) {
    return this.moduleDepMapping[this.getModuleId(moduleName)] || [];
  },

  // 根据模块名，获取模块id.
  getModuleId: function(moduleName) {
    var version = this.version;
    moduleName = path.normalize(moduleName);
    var root = this.root || (this.root = '');
    var modId = '';
    var ext = path.extname(moduleName);
    var extReg = new RegExp('\\' + ext + '$');

    var idRule = this.getConfig('idRule');

    if (this.type === 'js') {
      moduleName = moduleName.replace(extReg, '');
    }
    return help.generateModuleId(idRule, {
      root: root,
      name: this.name,
      version: this.version,
      moduleName: moduleName
    });
  },

  // 获取global module id.
  // support class: 0.9.0 ==> class: class/0.9.0/class
  // 如果设置slient不提示警告.
  // 根据 **throwErrorOnDepNotFound** 确定如果没有发现依赖的模块则提示错误.
  getGlobalModuleId: function(moduleName, slient) {
    var allGlobalDeps = this.allGlobalDeps;
    var moduleId = this.dependencies[moduleName];

    // 允许用户简化依赖配置.
    if (help.isVersion(moduleId)) {
      moduleId = env.normalizePath(path.join(moduleName, moduleId, moduleName));
    }

    if (!moduleId && !slient && allGlobalDeps.indexOf(moduleName) > -1) {

      // fix https://github.com/seajs/spm/issues/192
      var errMsg = 'Not Found ' + moduleName + ' dependency!';
      if (this.getConfig('throwErrorOnDepNotFound')) {
        throw new Error(errMsg);
      } else {
        console.warn(errMsg);
        moduleId = moduleName;
      }
    }
    return moduleId || moduleName;
  },

  // 重置模块id.
  resetGlobalModuleId: function(moduleName, moduleId) {
    this.dependencies[moduleName] = moduleId;
  },

  // 根据模块的文件路径，和模块的相对依赖，获取依赖模块的路径
  getDepModulePath: function(modulePath, depModule) {
    return path.join(path.dirname(modulePath), depModule);
  },

  // 从build目录获取模块代码，因为我们后续操作的代码都应该是build目录中的.
  getModuleCode: function(moduleName) {
    return fsExt.readFileSync(this.buildDirectory,
            help.normalizeModule(moduleName));
  },

  // 获取全局模块代码.
  getGlobalModuleCode: function(moduleId, callback) {
    return this.moduleSources.getModule(moduleId, function(err, moduleCode) {
      callback(moduleCode);
    });
  },

  /**
   * 获取指定类型的正则.
   * @param {String} moduleType 具体模块类型正则.
   * @return {RegExp} 返回对应类型正则.
   */
  getReqModRegByType: function(moduleType, isGlobal) {
    // fix https://github.com/seajs/spm/issues/342
    var flag = 'g';
    
    if (isGlobal === false) {
      flag = '';
    }

    return new RegExp('(^|[^.])\\brequire\\s*\\(\\s*(["\'])(' +
      moduleType + ')\\2\\s*\\)', flag);
  },

  /**
   * 获取指定类型的正则.
   * @param {String} moduleType 具体模块类型正则.
   * @return {RegExp} 返回对应类型正则.
   */
  getAsyncReqModRegByType: function(moduleType, isGlobal) {

    var flag = 'g';
    
    if (isGlobal === false) {
      flag = '';
    }

    return new RegExp('(^|[^.])\\brequire\\.async\\(\\s*(["\'])(' +
      moduleType + ')\\2\\s*\\)', flag);
  },

  // 获取主源下面模块信息.
  getSourceModuleInfo: function(callback) {
    this.moduleSources.getSourceModuleInfo(callback);
  },

  // 获取模块，从源中或本地缓存.
  getSourceModule: function(moduleId, callback) {
    this.moduleSources.getSourceModule(moduleId, function(err, _modId, filePath) {
      callback(err, _modId, filePath);
    });
  },
  
  getConfig: function(name) {
    var options = this.options;
    var value = options.getConfig(name);

    // 参数的优先级高于配置.
    if (typeof value !== 'undefined') {
      return value;
    }

    var actionConfig = (this.spmConfig && this.spmConfig[ACTION]) || {};
    var configValue = (actionConfig && actionConfig[name]);
    var modObj = this.modConfig.get();

    if (!configValue) {
       return configValue;
    }

    if (typeof configValue === 'string') {
      value = StringUtil.tmpl(configValue, this.modConfig.get());
      // return options.parse(name, value, actionConfig || commonConfig);
      return value;
    } else {
      return configValue; 
    }
    // 如果存在，需要通过 action options 的值规整.
  }
};

// 用户可以配置某些模块到页面在去解析.
var getReservedDeps = exports.getReservedDeps = function(deps) {
  var reservedDeps = [];
  for (var dep in deps) {
    if (deps[dep] === dep) {
      reservedDeps.push(dep);
    }
  }
  return reservedDeps;
};

var normalizeDeps = exports.normalizeDeps = function(deps) {
  Object.keys(deps).forEach(function(aliasName) {
    var modId = deps[aliasName];
    // 允许用户简化依赖配置.
    if (help.isVersion(modId)) {
      deps[aliasName] = env.normalizePath(path.join(aliasName, modId, aliasName));
    }
  });
};
