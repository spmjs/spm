var path = require('path');
var fs = require('fs');
var url = require('url');
var tar = require("tar");
var zlib = require('zlib');
var async = require('async');
var request = require('request');
var fsExt = require('../../../utils/fs_ext.js');

var Sources = module.exports = function(isLocal, project) {
  this.isLocal = isLocal;
  this.project = project;
  this.sources = project.sources;
  this.initLocalSources();
};

Sources.prototype.initLocalSources = function() {
  this.sourceDir = path.join(process.env.HOME, '.spm', 'sources');
};


// 根据模块id获取模块内容
// TODO 如果每次都要从服务器更新呢？
Sources.prototype.getModule = function(moduleId, callback) {
console.log('fetch module ' + moduleId);
  var that = this;

  // 默认首先更新服务器资源
  // TODO 改为async.series
  async.waterfall([
    function(callback) {
      callback(null, '1');
      return;
      that.getSourceModule(moduleId, callback);
    },
    function(moduleTarPath, callback) {
      callback(null);
      return;
      that.unpackModuleTar(moduleTarPath, callback);
    },
    function(callback) {
      that.getLocalSourceModule(moduleId, callback);
    }
  ], function(err, moduleCode) {
    callback(err, moduleCode);
  });
};

Sources.prototype.unpackModuleTar = function(moduleTarPath, callback) {

  // 如果存在解压缩，然后继续递归调用.
  log('UNPACK ' + moduleTarPath);
  unpack(moduleTarPath, function() {
    callback();
  });
};

// 尝试从本地源中获取模块.
Sources.prototype.getLocalSourceModule = function(moduleId, callback) {
  var that = this;
  var moduleInfo = moduleIdParse(moduleId);

  var localPaths = this.sources.map(function(source, callback){
    return path.join(that.sourceDir, getHost(source), moduleInfo.filepath);
  }); 

// console.log('locaPaths---->' + localPaths);
  async.detectSeries(localPaths, function(localFilePath, callback) {
    callback(fs.existsSync(localFilePath));
  }, function(localFilePath) {
    if (!localFilePath) {
      var errMsg = 'Did not find the modules' + moduleId + ' you need';
      callback(errMsg);
      return;
    }
    callback(null, fsExt.readFileSync(localFilePath));
  });
};

/**
 * downlaod module.tgz to local.
 */
Sources.prototype.getSourceModule = function(moduleId, callback) {
    // 1. 根据sources构建出request url. 
    // 2. request.head 检查所有的url是否有满足的.
    // 3. 不满足提示错误
    // 4. 下载tgz到对应的本地仓库目录，并触发后续事件.

  var that = this;
  var moduleInfo = moduleIdParse(moduleId);
  var requestUrls = this.sources.map(function(source){
    return source + '/' + path.join(moduleInfo.modulePath, moduleInfo.moduleTar)
  }); 

  async.detectSeries(requestUrls, function(requestUrl, callback) {

    log('GET ' + requestUrl);
    request.head(requestUrl, function(err, res) {
      log('HTTP ' + res.statusCode); 
      callback(!err && (res.statusCode == 200));
    });

  }, function(requestUrl) {

    if (!requestUrl) {
      var errMsg = 'Download ' + moduleId + 'error!';
      callback(errMsg);
      return;
    }

    var urlObj = url.parse(requestUrl);
    var localSourcePath = path.join(that.sourceDir, getHost(requestUrl), moduleInfo.modulePath);
    fsExt.mkdirS(localSourcePath);
    var moduleTarPath = path.join(localSourcePath, moduleInfo.moduleTar);
    request(requestUrl).pipe(fs.createWriteStream(moduleTarPath)).on('close', function() {
      callback(null, moduleTarPath); 
    });
  });

};

var versionReg = /(?:\d+\.){2}\d+(?:-dev)?/;

// 根据moduleId返回模块信息
var moduleIdParse = exports.moduleIdParse = function(moduleId) {
  if (moduleId.indexOf('#') === 0) {
    moduleId = moduleId.slice(1);
  }

  var filepath = getSourceFilePath(moduleId);
  var modulePath = moduleId;

  while (versionReg.test(path.dirname(modulePath))) {
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
  }
};

// 获取文件在源中的路径，主要是添加了dist目录.
function getSourceFilePath(moduleId) {
  var filename = getJsFileNameByModuleId(moduleId);
  return path.join(path.dirname(moduleId), 'dist', filename);
}

// 根据ModuleId 获取模块文件名
function getJsFileNameByModuleId(moduleId) {
  var filename = path.basename(moduleId); 
  if (!path.extname(filename)) {
    filename += '.js';
  }
  return filename;
}

// 根据moduleId 获取模块名
// widget/0.9.6/templateable ==> widget
// alipay/xbox/1.0.0/iframeXbox ==> xbox
function getModuleNameByModuleId() {

}

function getHost(requestUrl) {
  if (requestUrl.indexOf('http') < 0) {
    requestUrl = 'http://' + requestUrl;
  }
  return url.parse(requestUrl).host;
}

function unpack(source, callback) {
  fs.createReadStream(source)
    .pipe(zlib.Unzip())
    .pipe(tar.Extract({path: path.dirname(source)}))
    .on("error", function (er) {
      var errMsg = 'Unpack ' + source + 'error!';
      console.error(errMsg).
      callback(errMsg);
    })
    .on("end", function () {
      var tar = path.basename(source);
      var name = tar.slice(0, tar.indexOf('.tgz'));
      var extractPath = path.join(path.dirname(source), name);
      fsExt.copydirSync(extractPath, path.join(extractPath, '..'));
      //fs.rmdirSync(extractPath);
      callback();
  });
}

function log() {
  console.log.apply(console, ['>>> '].concat([].slice.call(arguments)));
}
