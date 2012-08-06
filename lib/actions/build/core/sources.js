var path = require('path');
var fs = require('fs');
var url = require('url');
var tar = require('tar');
var zlib = require('zlib');
var async = require('async');
var request = require('request');
var fsExt = require('../../../utils/fs_ext.js');
var help = require('../../../utils/moduleHelp');

var Sources = module.exports = function(isLocal, project) {
  this.isLocal = isLocal;
  this.project = project;
  this.sources = project.sources;
  this.sourceDir = path.join(project.globalHome, 'sources');
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

      // 如果无法从服务器获取资源，提出警告，但是继续执行. 
      that.getSourceModule(moduleId, callback);
    },
    function(moduleTarPath, callback) {

      // 如果服务器无法从服务器获取资源，讲不会返回moduleTarPath
      // 如果没有就不进行解压，直接从本地读取.
      if (!moduleTarPath) {
        callback();
        return;
      }
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
  console.log('UNPACK ' + moduleTarPath);
  unpack(moduleTarPath, function() {
    callback();
  });
};

// 尝试从本地源中获取模块.
Sources.prototype.getLocalSourceModule = function(moduleId, callback) {
  var that = this;
  var moduleInfo = moduleIdParse(moduleId);

  var localPaths = this.sources.map(function(source, callback) {
    return path.join(that.sourceDir, help.getHost(source), moduleInfo.filepath);
  });

// console.log('locaPaths---->' + localPaths);
  async.detectSeries(localPaths, function(localFilePath, callback) {
    callback(fs.existsSync(localFilePath));
  }, function(localFilePath) {
    if (!localFilePath) {
      var errMsg = 'Did not find the modules ' + moduleId + ' you need';
      callback(errMsg);
      return;
    }
    callback(null, fsExt.readFileSync(localFilePath));
  });
};

// downlaod module.tgz to local.
Sources.prototype.getSourceModule = function(moduleId, callback) {
  // 1. 根据sources构建出request url.
  // 2. request.head 检查所有的url是否有满足的.
  // 3. 不满足提示错误
  // 4. 下载tgz到对应的本地仓库目录，并触发后续事件.

  var that = this;
  var moduleInfo = moduleIdParse(moduleId);
  var requestUrls = this.sources.map(function(source) {
    var sourceUrl = url.parse(source + path.sep + path.join(moduleInfo.modulePath,
        moduleInfo.moduleTar)).href;
    return sourceUrl.replace(/\\/g, '/');
  });

  async.detectSeries(requestUrls, function(requestUrl, callback) {

    request.head(requestUrl, function(err, res) {
      console.log('HTTP HEAD ' + ((res && res.statusCode) || 'error') + ' ' + requestUrl);
      callback(!err && (res.statusCode == 200));
    });

  }, function(requestUrl) {

    if (!requestUrl) {
      // 如果没有在服务器发现资源提示警告信息.
      console.error('Download ' + moduleId + ' error!');
      callback(null, null);
      return;
    }

    var urlObj = url.parse(requestUrl);
    var localSourcePath = path.join(that.sourceDir, help.getHost(requestUrl), moduleInfo.modulePath);
    fsExt.mkdirS(localSourcePath);
    var moduleTarPath = path.join(localSourcePath, moduleInfo.moduleTar);
console.log('HTTP GET ' + requestUrl);
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
  };
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

function unpack(source, callback) {
  fs.createReadStream(source)
    .pipe(zlib.Unzip())
    .pipe(tar.Extract({path: path.dirname(source)}))
    .on('error', function(er) {
      var errMsg = 'Unpack ' + source + 'error!';
      console.error(errMsg).
      callback(errMsg);
    })
    .on('end', function() {
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
