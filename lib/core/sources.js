var path = require('path');
var fs = require('fs');
var url = require('url');
var util = require('util');
var zlib = require('zlib');
var async = require('async');
var request = require('request');
var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var tar = require('../utils/tar.js');
var help = require('../utils/moduleHelp');

var argv = require('optimist').argv;

var Sources = module.exports = function(project) {
  this.project = project;
  this.sources = project.sources;
  this.sourceDir = path.join(project.globalHome, 'sources');
  initVersionRule(project);
};

// 根据模块id获取模块内容
// TODO 默认如果依赖的是稳定版的模块，只从本地更新，不从服务器更新，强制更新通过--force-update
// TODO 支持本地源
// TODO 对服务源进行缓存，而对本地源则不进行缓存.
Sources.prototype.getModule = function(moduleId, callback) {
  console.log('fetch module ' + moduleId);
  var that = this;

  // 1. 判断模块Id是否是
  // 默认首先更新服务器资源

  async.waterfall([
    function(callback) {
      // 如果无法从服务器获取资源，提出警告，但是继续执行. 
      that.getSourceModule(moduleId, callback);
    },

    function(moduleId, moduleFilePath, callback) {
      that.getLocalSourceModule(moduleId, moduleFilePath, callback);
    }
  ], function(err, moduleCode) {
    callback(err, moduleCode);
  });
};


// 尝试从本地源中获取模块.
Sources.prototype.getLocalSourceModule = function(moduleId, moduleFilePath, callback) {

  if (!moduleFilePath) {
    var errMsg = 'Did not find the modules ' + moduleId + ' you need';
    callback(errMsg);
    return;
  }
  callback(null, fsExt.readFileSync(moduleFilePath));
};

// downlaod module.tgz to local.
// 首先检查服务器中是否已经缓存.
Sources.prototype.getSourceModule = function(moduleId, callback) {
  // 1. 根据sources构建出request url.
  // 2. request.head 检查所有的url是否有满足的.
  // 3. 不满足提示错误
  // 4. 下载tgz到对应的本地仓库目录，并触发后续事件.

  var that = this;
  var moduleInfo = moduleIdParse(moduleId, this.project);
  var requestUrls = this.sources.map(function(source) {

    if (isLocalSource(source)) {
      return path.join(source, moduleInfo.filepath);
    } else {
      var sourceUrl = url.parse(source + path.sep + path.join(moduleInfo.modulePath,
        moduleInfo.moduleTar)).href;

      // 如果没有强制更新，而且发现模块的版本是稳定版的话
      // 我们就把requestUrl转换为本地url(缓存地址).
      if (!argv['force-update'] && isStableVersion(moduleInfo.version)) {
        var localModulePath = that.getLocalModulePathBySource(sourceUrl, moduleInfo);
        if (fsExt.existsSync(localModulePath)) {
          return localModulePath;
        } 
      }

      return env.normalizePath(url.parse(source + path.sep + path.join(moduleInfo.modulePath,
        moduleInfo.moduleTar)).href);
    }

  });

  async.detectSeries(requestUrls, function(requestUrl, callback) {

    // local sources;
    if (isLocalSource(requestUrl)) {
      callback(fsExt.existsSync(requestUrl));
      return;
    }

    request.head(requestUrl, function(err, res) {
      console.log('HTTP HEAD ' + ((res && res.statusCode) || 'error') + ' ' + requestUrl);
      callback(!err && (res.statusCode == 200));
    });

  }, function(requestUrl) {

    if (!requestUrl) {

      // 如果没有在服务器发现资源提示警告信息.
      var errMsg = 'find ' + moduleId + ' error!'
      console.error(errMsg);
      callback(null, moduleId, null);
      return;
    }
    console.log('find requestUrl--->', requestUrl);
    if (isLocalSource(requestUrl)) {
      callback(null, moduleId, requestUrl);
    } else {
      var urlObj = url.parse(requestUrl);
      var localSourcePath = path.join(that.sourceDir, help.getHost(requestUrl), moduleInfo.modulePath);
      fsExt.mkdirS(localSourcePath);

      var moduleTarPath = path.join(localSourcePath, moduleInfo.moduleTar);
      console.info('HTTP GET ' + requestUrl);

      request(requestUrl).pipe(fs.createWriteStream(moduleTarPath)).on('close', function() {

        // 如果发现了模块，下载完成后，就开始进行解压操作.
        that.unpackModuleTar(moduleTarPath, function() {
          callback(null, moduleId, that.getLocalModulePathBySource(requestUrl, moduleInfo));
        });
      });
    }

  });
};

Sources.prototype.getLocalModulePathBySource = function(requestUrl, moduleInfo) {
  return path.join(this.sourceDir, help.getHost(requestUrl), moduleInfo.filepath);
};

var versionReg = /[v=]*\s*([0-9]+)\.([0-9]+)\.([0-9]+)(-[0-9]+-?)?([a-zA-Z-][a-zA-Z0-9-.:]*)?\s*/;

function initVersionRule(project) {
  var rules = [];
  var versionRule;
  if (project.config && project.config.versionRule) {
    versionRule = project.config.versionRule;
    if (typeof versionRule === 'string') {
      versionRule = [new RegExp(versionRule)];
    }
    
    if (!util.isRegExp(versionRule)) {
      return;
    }
    
    containVersion = function(str) {
      return versionReg.test(str) || versionRule.test(str); 
    }
  }
};

function containVersion(str) {
  return versionReg.test(str);
};

function isStableVersion(version) {
  return !/\-[a-zA-Z]+$/.test(version);  
}

function isLocalSource(requestUrl) {
  return requestUrl.indexOf('http') < 0;
};

Sources.prototype.unpackModuleTar = function(moduleTarPath, callback) {

  // 如果存在解压缩，然后继续递归调用.
  console.log('UNPACK ' + moduleTarPath);
  tar.extract(moduleTarPath, path.dirname(moduleTarPath), function(err) {
    if (err) {
      var errMsg = 'Unpack ' + moduleTarPath + 'error!';
      callback(errMsg); 
      return;
    } 
    var tar = path.basename(moduleTarPath);
    var name = tar.slice(0, tar.indexOf('.tgz'));
    var extractPath = path.join(path.dirname(moduleTarPath), name);
    fsExt.copydirSync(path.join(extractPath, 'dist'), path.join(extractPath, '..'));
    
    // copy src dir
    var modSrc = path.join(extractPath, 'src');
    if (fsExt.existsSync(modSrc)) {
      var srcDir = path.join(extractPath, '..', 'src');
      fsExt.mkdirS(srcDir);
      fsExt.copydirSync(modSrc, srcDir);
    }

    // 此处直接删除回报一个IO错误，估计是copy文件和删除文件有点冲突。
    // 估计是nodejs的问题.
    setTimeout(function() {
      fs.unlinkSync(moduleTarPath);
      fsExt.rmdirRF(extractPath);
      callback();
    }, 50);
  });
};


// 根据moduleId返回模块信息
var moduleIdParse = exports.moduleIdParse = function(moduleId, project) {
  /**
   * 由于目前很多模块都没有写#所以，#默认就是根目录，不再做其他映射.
  if (moduleId.indexOf('#') === 0) {
    if (project.alias && project.alias['#']) {
      moduleId = moduleId.replace(/#/, project.alias['#'] + '/');
    } else {
      moduleId = moduleId.slice(1);
    }
  }
  **/
  if (moduleId.indexOf('#') === 0) {
      moduleId = moduleId.slice(1);
  }

  var filepath = getSourceFilePath(moduleId);
  var modulePath = moduleId;

  while (containVersion(path.dirname(modulePath))) {
    modulePath = path.dirname(modulePath);
  }

  var version = path.basename(modulePath);
  var moduleRelaPath = path.dirname(modulePath);
  var moduleName = path.basename(path.join(modulePath, '..'));
  var moduleTar = moduleName + '.tgz';

  return {
    moduleId: moduleId,
    moduleName: moduleName,
    filepath: filepath,
    moduleTar: moduleTar,
    version: version,
    modulePath: modulePath
  };
};

// 获取文件在源中的路径.
function getSourceFilePath(moduleId) {
  var filename = getJsFileNameByModuleId(moduleId);
  return path.join(path.dirname(moduleId), filename);
}

// 根据ModuleId 获取模块文件名
function getJsFileNameByModuleId(moduleId) {
  var filename = path.basename(moduleId);
  if (!path.extname(filename)) {
    filename += '.js';
  }
  return filename;
}
