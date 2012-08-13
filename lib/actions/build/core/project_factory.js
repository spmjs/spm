// 项目分析模块

var path = require('path');
var fs = require('fs');

var fsExt = require('../../../utils/fs_ext.js');
var WinOs = require('../../../utils/win_os.js');
var StringUtil = require('../../../utils/string.js');
var PluginFactory = require('./plugin_factory.js');

var help = require('../../../utils/moduleHelp');
var Sources = require('./sources.js');
var isRelative = help.isRelative;

var SPM_CONFIG = 'config.json';
var CONFIG = 'package.json';

var isWindows = process.platform === 'win32';
var home = isWindows ? process.env.USERPROFILE : process.env.HOME;

var argv = require('optimist').
    usage('Usage: $0 --global-config[use user custom config]').argv;


/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 用户执行的操作.
 * @param {Object} modDir 项目目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, modDir, callback) {
  return new Module(action, modDir, callback);
};

//项目基类，里面将封转一些常用的方法.
function Module(action, modDir, callback) {
  var that = this;
  var modInfo;
  this.baseDirectory = modDir;

  this.globalHome = path.join(home, '.spm');

  var modConfig = Module.prototype.__proto__ = this._parseConfig();
  this._initGlobalInfo(modConfig);

  // 查找那些是保留依赖.
  this._initResolvedDeps();
  this.plugins = PluginFactory.getPlugins(action);
  console.log('project plugins: ', this.plugins);

  this.moduleDepMapping = {};
  this.moduleSources = new Sources(this);
  callback(that);
}

Module.prototype = {

  // 配置文件解析 https://github.com/seajs/spm/issues/155
  _parseConfig: function() {

    // 获取基本信息.
    var baseModInfo = getPackageInfo(path.join(this.baseDirectory, CONFIG));
    // 循环遍历parent信息.
    var baseDir = this.baseDirectory;
    while (!StringUtil.endWith(baseDir, path.sep)) {
      baseDir = path.dirname(baseDir);
      var _config = path.join(baseDir, CONFIG);
      if (fs.existsSync(_config)) {
        mergeConfig(baseModInfo, getPackageInfo(_config));
      }
    }

    var _spmConfig = this._getSpmConfig();
    console.log('spmConfig----->', _spmConfig);

    if (!fsExt.existsSync(_spmConfig)) {
      this._createGlobalConfig();
    }
    mergeConfig(baseModInfo, getPackageInfo(_spmConfig));

    baseModInfo.root = baseModInfo.root || '#';
    baseModInfo.sources = this._perfectSources(baseModInfo.sources); 

    return baseModInfo;
  },

  _getSpmConfig: function() {
    var gc = argv['global-config'];

    if (gc) {
      gc = perfectLocalPath(gc);
    } else {
      gc = path.join(this.globalHome, SPM_CONFIG);
    }

    return gc;          
  },

  _perfectSources: function(sources) {
    sources = sources || [];
    return sources.map(function(source) {
      if (isLocalPath(source)) {
        source = perfectLocalPath(source);
      } else {
        if (source.indexOf('http') !== 0) {
          source = 'http://' + source;
        }
      }
      return source;
    });
  },

  // 初始化项目的一些全局信息.
  _initGlobalInfo: function(modConfig) {

    // 目前模块名称是通过配置获取.
    this.name = modConfig.name;
    this.version = modConfig.version;
    this.sources = modConfig.sources;
    var source = this.getSource();

    var root = this.root;
    if (root === '#') {
      root = '';
    }

    // 如果是本地源.
    if (help.isLocalPath(source)) {
      this.baseSourcePath = source; 
    } else {
      this.baseSourcePath = path.join(this.globalHome, 'sources', 
        help.getHost(source));
    }
  
    // 模块基本路径 root/name/version
    this.baseModuleDir = path.join(root, this.name, this.version);
  
    // TODO 后续支持src, dist配置.
    var baseDir = this.baseDirectory;
    this.distDirectory = path.join(baseDir, 'dist');
    this.srcDirectory = path.join(baseDir, 'src');
    this.buildDirectory = path.join(baseDir, 'build');
  
    // 创建相关目录。
    fsExt.mkdirS(this.buildDirectory);
    fsExt.mkdirS(this.distDirectory);

    this.type = this._getProjectType();
  },

  _initResolvedDeps: function() {
    var deps = this.dependencies;
    var resolvedDeps = this.resolvedDeps = [];
    for (var dep in deps) {
      if (deps[dep] === dep) {
        resolvedDeps.push(dep);
      } 
    }
  },

  // 获取项目source.由于可能有多个数据源, 默认用户配置的第一个source为项目source.
  getSource: function() {
    var sources = this.sources;        
    if (!sources || sources.length === 0) {
      console.warn(this.name + ' not found available source!');
      return '';
    }
    return sources[0];
  },

  _getProjectType: function() {
    var srcDirectory = this.srcDirectory; 
    var files = fs.readdirSync(srcDirectory);
    var isJs = files.some(function(filename) {
      return path.extname(filename) === '.js';
    });
    return isJs ? 'js' : 'css';
  },

  // 如果用户没有配置~/.spm/config.json,自动替用户创建.                  
  _createGlobalConfig: function() {
    var tplConfigDir = path.join(path.dirname(module.filename),'../help/');
    fsExt.mkdirS(this.globalHome);
    fsExt.copyFileSync(tplConfigDir, this.globalHome, SPM_CONFIG);
  },

  // 获取指定模块的依赖关系.
  getDepMapping: function(moduleName) {
    return this.moduleDepMapping[this.getModuleId(moduleName)];
  },

  // 根据模块名，获取模块id.
  getModuleId: function(moduleName) {
    var version = this.version;
    var modId = this.root;
    if (modId !== '#') {
      modId = modId + '/';
    }
    var ext = path.extname(moduleName);
    modId = path.join(modId + this.name, version, moduleName.replace(ext, ''));
    return WinOs.normalizePath(modId);
  },

  // 获取global module id.
  // support class: 0.9.0
  getGlobalModuleId: function(moduleName) {
    var moduleId = this.dependencies[moduleName];
    if (isVersion(moduleId)) {
      moduleId = WinOs.normalizePath(path.join(moduleName, moduleId, moduleName));
    }
    return moduleId;
  },

  // 重置模块id.
  resetGlobalModuleId: function(moduleName, moduleId) {
    this.dependencies[moduleName] = moduleId;
  },

  // 根据模块name，生成模块路径。
  getModulePath: function(moduleName) {
    return path.join(this.srcDirectory, moduleName);
  },

  // 根据模块的文件路径，和模块的相对依赖，获取依赖模块的路径
  getDepModulePath: function(modulePath, depModule) {
      return path.join(path.dirname(modulePath), depModule);
  },

  // 根据当前Module和依赖的module解析出依赖的模块Id,
  getDepModuleId: function(activeModule, depModule) {
    var depModulePath = path.join(this.srcDirectory,
        path.dirname(activeModule), depModule) + '.' + this.type;
    return this.moduleIdMapping[depModulePath];
  },

  // 从build目录获取模块代码，因为我们后续操作的代码都应该是build目录中的.
  getModuleCode: function(moduleName) {
    return fsExt.readFileSync(this.buildDirectory, normalize(moduleName));
  },

  // 获取全局模块代码.
  getGlobalModuleCode: function(moduleId, callback) {
    return this.moduleSources.getModule(moduleId, function(err, moduleCode) {
      callback(moduleCode);
    });
  },

  // 获取模块的依赖关系
  getModuleDepMapping: function(moduleId) {
    return this.moduleDepMapping[moduleId];
  },

  // parse package.json
  getProjectInfo: function() {
    return getProjectInfo(this.projectDir);
  },

  /**
   * 获取指定类型的正则.
   * @param {String} moduleType 具体模块类型正则.
   * @return {RegExp} 返回对应类型正则.
   */
  getReqModRegByType: function(moduleType) {
    return new RegExp('(^|[^.])\\brequire\\s*\\(\\s*(["\'])(' +
      moduleType + ')\\2\\s*\\)', 'g');
  }
};

// 获取模块配置信息.
function getPackageInfo(config) {
  return eval('(' + fsExt.readFileSync(config) + ')');
}

/**
 * 目前可能存在多级parent, 我们要根据项目不同的属性，进行属性合并.
 * projectA
 *   package.json
 *     modulesA
 *     package.json
 *       moduleA1
 *         package.json
 *         src
 *       moduleA2
 *         package.json
 *         src
 *      modulesB
 *      package.json
 *        moduleB1
 *          package.json
 *          src
 */
function mergeConfig(baseConfig, parentConfig) {
  Object.keys(parentConfig).forEach(function(key) {
    if (baseConfig.hasOwnProperty(key)) {
      var parentValue = parentConfig[key];
      var baseValue = baseConfig[key];
      if (Array.isArray(parentValue)) {
        parentValue.forEach(function(v) {
          baseValue.push(v);
        });
      } else if (typeof parentValue == 'object') {
        var _proto = baseValue;
        while (_proto.__proto__.__proto__ !== null) {
          _proto = _proto.__proto__;
        }
        _proto.__proto__ = parentValue;
      }

    } else {
      baseConfig[key] = parentConfig[key];
    }
  });
}

function getModuleInfo(dir) {
  return eval('(' + fsExt.readFileSync(dir, CONFIG) + ')');
}

function findParentModInfo(modDir) {
  var parentDir = path.join(modDir, '..');
  var modInfo = {};
  while (parentDir !== '/') {
    var parentConfig = path.join(parentDir, CONFIG);
    if (fs.existsSync(parentConfig)) {
      var _modInfo = getModuleInfo(parentDir);
      modInfo.__proto__ = _modInfo;
      if (_modInfo.type === 'parent') {
        if (!_modInfo.repo) {
          // 提供默认仓库地址.
          _modInfo.repo = path.join(parentDir, 'dist');
        }
        return modInfo;
      } else {
        modInfo = _modInfo;
      }
    }
    parentDir = path.join(parentDir, '..');
  }
  return null;
}

function getParentTypeByModInfo(modInfo) {
  while (modInfo.__proto__ !== null) {
    if (modInfo.hasOwnProperty('type')) {
      if (modInfo.type === 'parent') {
        return modInfo.name;
      }
    }
    modInfo = modInfo.__proto__;
  }
}

function getSpmConfig(configDir) {
  var define = function(__config) {
    return __config;
  };
  var seajs = {
    config: function(__config) {
      return __config;
    }
  };
  var spmConfigStr;
  if (!fs.existsSync(configDir)) {
    console.warn('The lack of global configuration information');
    return null;
  }
  var spmConfigStr = fsExt.readFileSync(configDir);
  return eval(spmConfigStr);
}

function isLocalPath(requestUrl) {
  if (requestUrl.indexOf('~') === 0) return true;
  if (requestUrl.indexOf('http') > -1) return false;
  if (fsExt.existsSync(requestUrl)) {
    return true;
  }
  return false;
}

function perfectLocalPath(localPath) {
  if (localPath.indexOf('~') === 0){
    return localPath.replace(/~/, home);
  }
  return localPath;
}

function getCharNum(str, c) {
  return str.split(c).length - 1;
}

var versionReg = /^(?:\d+\.){2}\d+(?:-dev)?$/;
function isVersion(id) {
  return versionReg.test(id);
}

function normalize(module) {
  module = path.normalize(module);
  if (!path.extname(module)) {
    module += '.js';
  }
  return module;
}
