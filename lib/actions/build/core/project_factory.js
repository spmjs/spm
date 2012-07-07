// 项目分析模块

var path = require('path');
var vm = require('vm');
var fs = require('fs');
var util = require('util');
var astParser = require('uglify-js').parser;

var fsExt = require('../utils/fs_ext.js');
var win_os = require('../utils/win_os.js');
var Ast = require('../../../utils/ast.js');

var PluginFactory = require('./plugin_factory.js');
var Dependency = require('./dependency.js');

var SPM_CONFIG = 'spm-config.js';
var CONFIG = 'package.json';

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 用户执行的操作.
 * @param {Object} projectDir 项目目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, modDir) {
  return new Module(action, modDir);
};

//项目基类，里面将封转一些常用的方法.
function Module(action, modDir) {
  var modInfo;
  this.moduleDir = modDir;
    
  // 初始化整体模块信息.
  this._initGlobalRepos();
  this._initModuleInfo();
  modInfo = this.moduleInfo;

  this.repo = modInfo.repo;
  this.parentType = this.moduleInfo.parentType;
  this.id = this.getModuleName();
  this.version = modInfo.version;
  this.type = modInfo.type || 'js';
  this.dist = modInfo.dist;
 
  this._initModuleDirInfo();
  this.plugins = PluginFactory.getPlugins(action, this.type);

  this.alias = getAliasByModInfo(modInfo);

  // 仅在合并文件输出的时候使用.
  this.mobileAlias = modInfo['alias-mobile'] || null;

  this.initModuleList();
  this.initModuleIdMapping();
  var dependency = new Dependency(this);
  this.moduleDepMapping = dependency.getModuleDepMapping();

  if (modInfo.compress === 'closure') {
    this.compress = require('../compress/closure.js');
  }
}

Module.prototype = {

  // 初始化全局仓库信息,后续用户可能依赖多个全局项目, 比如arale, alipay等.
  _initGlobalRepos: function() {
    var globalConfig = getSpmConfig(path.join(process.env.HOME,
                '.spm', SPM_CONFIG));
    if (globalConfig !== null) {
      this.globalRepos = globalConfig.repos;
    } 
  },
  
  // 初始化全局项目信息,比如arale, handy等配置在仓库的模块信息
  _initModuleInfo: function() {
    var modInfo = this.moduleInfo = this._getModuleInfo();

    var baseType = this.baseType = modInfo.baseType;
    this.isBaseModule = false;
    if (!baseType) {

      // 如果不存在这个类型，我们确定是顶级项目,也就是模块的id会是#开头.
      this.isBaseModule = true;
      this.baseRepo = modInfo.repo;
    } else {
      this.baseRepo = this._getBaseRepoInfo(); 
    }
  },

  // 获取整个模块主要信息
  _getModuleInfo: function() {

    // 获取基本信息.
    var modInfo = getProjectInfo(this.moduleDir);

    // 分析模块类型.
    if (!modInfo.parentType || !modInfo.repo) {
      var parentMod = findParentModInfo(this.moduleDir);
      if (parentMod === null) {
        throw new Error('The lack of module parent type information!');
      }
      modInfo.parentType = modInfo.parentType ||
          getParentTypeByModInfo(parentMod);
    }
    modInfo.type = modInfo.type || 'js';
    
    // 继承alias等配置.
    modInfo.__proto__ = parentMod;
    return modInfo;
  },

  // 初始化全局仓库信息.
  // TODO 后续如果用户不配置的话，我们有一个默认的全局仓库信息.
  //      需要等到仓库服务开发完成.
  _getBaseRepoInfo: function() {
    return path.join(this.globalRepos[this.baseType].localDir, 'dist'); 
  },

  // 构建alias原型链.
  _parseAlias: function() {
               
  },

  // 初始化相关目录信息.
  _initModuleDirInfo: function() {
    var modDir = this.moduleDir;
    this.srcDirectory = path.join(modDir, 'src');
    this.buildDirectory = path.join(modDir, 'build');
    this.distDirectory = path.join(this.buildDirectory, 'dist');

    // 创建Build目录。
    fsExt.mkdirS(this.buildDirectory);

    // 创建dist目录。
    fsExt.mkdirS(this.distDirectory);
  },

  // 根据 dist 配置，找到相关需要处理的模块文件，因为可能存在资源文件
  initModuleList: function() {
    var that = this;
    var moduleList = [];
    var dists = this.dist;
    var type = this.type;
    var distName, distValue;

    for (distName in dists) {

      if (dists.hasOwnProperty(distName)) {
        if (/\.css$|\.tpl$/.test(distName)) {
          continue;
        }

        if (/^[_\w-]+$/.test(distName)) {
          // 资源目录
          continue;
        }

        distValue = dists[distName];

        if (distValue === 'default') {
          this._addModule(distName);
          continue;
        }

        if (util.isArray(distValue)) {

          distValue.forEach(function(moduleName) {
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
    var modId;
    var version = this.moduleInfo.version;
    if (this.isBaseModule) {
      modId = '#';
    } else {
      modId = this.parentType + '/';
    }
    return path.join(modId + this.id, version, moduleName.split('.')[0]);
  },

  // 获取global module id.
  // TODO 是否有好的方法来判断是否是全局模块的依赖,这样可以自动给用户添加#
  getGlobalModuleId: function(moduleName) {
    var globalId = this.alias[moduleName];

    if (globalId.indexOf('#') === 0) {
      return globalId;
    } else if (getCharNum(globalId, '/') === 2){
      return '#' + globalId;
    } else {
      return globalId;
    }
  },

  // 获取无线模块id.
  getMobileModuleId: function(moduleName) {
    var mobileModId = this.mobileAlias[moduleName];
    return mobileModId.indexOf('#') === 0 ? mobileModId : '#' + mobileModId;
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

  // 获取当前模块名称, 默认模块名称就是目录名称.
  getModuleName: function() {
    var modDir = win_os.normalizePath(this.moduleDir);
    return modDir.slice(modDir.lastIndexOf('/') + 1,
        modDir.length);
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
  },

  getGlobalAlias: function() {
    var baseAlias = getProjectInfo(this.baseDir).alias;
    if (this.parentType !== 'arale' && this.parentType !== 'handy') {
      baseAlias.__proto__ = getProjectInfo(this.araleDir).alias;
    }
    return baseAlias;
  }
};

function getProjectInfo(dir) {
  return eval('(' + fsExt.readFileSync(dir, CONFIG) + ')');
}

function getModuleInfo(dir) {
  return eval('(' + fsExt.readFileSync(dir, CONFIG) + ')');
}


/**
 * 目前可能存在多级parent, 
 * 多级只是为了共享alias, 不过不建议配置太多级别的配置.
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

function getAliasByModInfo(modInfo) {
  var alias = {};
  var aliasList = [{}];
  while (modInfo !== null) {
    if (modInfo.hasOwnProperty('alias')) {
      aliasList.push(modInfo['alias']);
    }
    modInfo = modInfo.__proto__;
  }
  for (var i = 1, len = aliasList.length; i < len; i++) {
    aliasList[i - 1].__proto__ = aliasList[i];
  }
  return aliasList[0];
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

