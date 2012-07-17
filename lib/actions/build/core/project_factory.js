// 项目分析模块

var path = require('path');
var fs = require('fs');
var util = require('util');

var fsExt = require('../../../utils/fs_ext.js');
var PluginFactory = require('./plugin_factory.js');
var Dependency = require('./dependency.js');

var SPM_CONFIG = 'config.json';
var CONFIG = 'package.json';

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 用户执行的操作.
 * @param {Object} projectDir 项目目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, modDir, callback) {
  return new Module(action, modDir, callback);
};


//项目基类，里面将封转一些常用的方法.
function Module(action, modDir, callback) {
  var that = this;
  var modInfo;
  this.moduleDir = modDir;

  this.baseDirectory = modDir;
  var modConfig = Module.prototype.__proto__ = this._parseConfig();

  // 目前模块名称是通过配置获取.
  this.name = modConfig.name;
  this.version = modConfig.version;

  // TODO 后续支持src, dist配置.
  this.distDirectory = path.join(modDir, 'dist');
  this.srcDirectory = path.join(modDir, 'src');
  this.buildDirectory = path.join(modDir, 'build');

  // 创建相关目录。
  fsExt.mkdirS(this.buildDirectory);
  fsExt.mkdirS(this.distDirectory);
  
  this.plugins = PluginFactory.getPlugins(action, this.type);

  this.initModuleList();
  this.initModuleIdMapping();

  var dependency = new Dependency(this);
  dependency.getModuleDepMapping(function(moduleDepMapping) {
    that.moduleDepMapping = moduleDepMapping; 
    callback(that);
  });
}

Module.prototype = {

  // 配置文件解析 https://github.com/seajs/spm/issues/155
  _parseConfig: function() {
    // 获取基本信息.
    var baseModInfo = getPackageInfo(path.join(this.baseDirectory, CONFIG));
    // 循环遍历parent信息.
    var baseDir = this.baseDirectory;
    while (baseDir != '/') {
      baseDir = path.dirname(baseDir);
      var _config = path.join(baseDir, CONFIG);
      if (fs.existsSync(_config)) {
        mergeConfig(baseModInfo, getPackageInfo(_config));
      }
    }

    baseModInfo.type = this._getProjectType();
    return baseModInfo;
  },

  _getProjectType: function() {
    var srcDirectory = path.join(this.baseDir, 'src');
    var files = fs.readdirSync(srcDirectory);
    var isJs = files.some(function(filename) {
      if (filename.lastIndexOf('.js') === (filename.length - 3)) {
        return true;
      }
    });
    return isJs ? 'js' : 'css';
  },

  // 初始化全局仓库信息.
  // TODO 后续如果用户不配置的话，我们有一个默认的全局仓库信息.
  //      需要等到仓库服务开发完成.
  _getBaseRepoInfo: function() {
    return path.join(this.globalRepos[this.baseType].localDir, 'dist'); 
  },

  // 初始化相关目录信息.
  _initModuleDirInfo: function() {
    var modDir = this.moduleDir;
    this.srcDirectory = path.join(modDir, 'src');
    this.buildDirectory = path.join(modDir, 'build');
    this.distDirectory = path.join(this.buildDirectory, 'dist');

  },

  // 根据 dist 配置，找到相关需要处理的模块文件，因为可能存在资源文件
  initModuleList: function() {
    var that = this;
    var moduleList = [];
    var output = this.output;
    var type = this.type;
    var name, value;

    for (name in output) {

      if (output.hasOwnProperty(name)) {
        if (/\.css$|\.tpl$/.test(name)) {
          continue;
        }

        if (/^[_\w-]+$/.test(name)) {
          // 资源目录
          continue;
        }

        value = output[name];

        if (value === 'default') {
          this._addModule(name);
          continue;
        }

        if (util.isArray(value)) {

          value.forEach(function(moduleName) {
            that._addModule(moduleName);
          });
        }
      }
    }
  },

  _addModule: function(moduleName) {
    var moduleList = this.moduleList || (this.moduleList = []);
    !(~moduleList.indexOf(moduleName)) && moduleList.push(moduleName);
  },

  // 获取项目中模块名(模块全路径)和id的映射关系
  // id 映射
  // ['sw.js', 'plugins/effect.js', 'tabs.js',
  //    'plugins/autoplay.js'] =>
  // {
  //  '{projectDir}/build/switchable.js': '#sw/0.9.4/switchable',
  //  '{projectDir}/build/plugins/effect.js': '#sw/0.9.4/plugins/effect',
  //  '{projectDir}/build/tabs.js': '#sw/0.9.4/tabs',
  //  '{projectDir}/build/plugins/auto.js': '#sw/0.9.4/plugins/auto'
  // }
  initModuleIdMapping: function() {
    var that = this;
    var modIdMapping = this.moduleIdMapping = {};

    this.moduleList.forEach(function(moduleName) {
      modIdMapping[that.getModulePath(moduleName)] =
          that.getModuleId(moduleName);
    });
  },

  // 根据模块民成，获取模块id.
  getModuleId: function(moduleName) {
    var version = this.version;
    var modId = this.root;
    if (modId !== '#') {
      modId = modId + '/';
    }
    return path.join(modId + this.name, version, moduleName.split('.')[0]);
  },

  // 获取global module id.
  // TODO 是否有好的方法来判断是否是全局模块的依赖,这样可以自动给用户添加#
  getGlobalModuleId: function(moduleName) {
    var globalId = this.moduleDependencies[moduleName];
    if (globalId.indexOf('#') === 0) {
      return globalId;
    } else if (getCharNum(globalId, '/') === 2){
      return '#' + globalId;
    } else {
      return globalId;
    }
  },

  // 根据模块name，生成模块路径。
  getModulePath: function(moduleName) {
    return path.join(this.srcDirectory, moduleName);
  },

  // 根据当前Module和依赖的module解析出依赖的模块Id,
  getDepModuleId: function(activeModule, depModule) {
    var depModulePath = path.join(this.srcDirectory,
        path.dirname(activeModule), depModule) + '.' + this.type;
    return this.moduleIdMapping[depModulePath];
  },

  // 获取css module id.
  getCssDepModuleId: function(activeModule, depModule) {
    var modId = '#';
    if (this.parentType == 'alipay') {
      modId = this.parentType + '/';
    } else if (this.parentType !== 'arale' && this.parentType !== 'handy') {
      modId = '~/' + this.parentType + '/';
    }
    return modId + this.id + '/' + this.projectInfo.version +
        '/' + path.join(path.dirname(activeModule), depModule);
  },

  // 从build目录获取模块代码，因为我们后续操作的代码都应该是build目录中的.
  getModuleCode: function(moduleName) {
    return fsExt.readFileSync(this.buildDirectory, moduleName);
  },

  // 从源文件目录中获取模块代码.
  getSrcModuleCode: function(moduleName) {
    return fsExt.readFileSync(this.srcDirectory, moduleName);
  },

  // 获取模块的依赖关系
  getModuleDepMapping: function(moduleId) {
    return this.moduleDepMapping[moduleId];
  },

  // parse package.json
  getProjectInfo: function() {
    return getProjectInfo(this.projectDir);
  },

  getProjectId: function() {
    console.error('change to getModulename');           
  },

  // 获取当前项目整体信息.
  parseParentConfig: function() {
    var baseDir = this.baseDir;
    // HACK 由于在自己的项目中没有配置父类信息，所以只能通过路径来parse.
    var parentConfig = getProjectInfo(baseDir);

    // HACK 根据整体项目目录来决定项目类型, arale, alipay, cashier
    parentConfig.parentType = path.basename(baseDir).replace(/\//g, '');
    return parentConfig;
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
      if (util.isArray(parentValue)) {
        parentValue.forEach(function(v) {
          baseValue.push(v);
        });
      } 

      if (typeof parentValue == 'object') {
        var _proto = baseValue;
        while(_proto.__proto__.__proto__ !== null) {
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
  if (!fs.existsSync(configDir)){
    console.warn('The lack of global configuration information');
    return null;
  }
  var spmConfigStr = fsExt.readFileSync(configDir);
  return eval(spmConfigStr);
}

function getCharNum(str, c) {
  return str.split(c).length - 1; 
}

