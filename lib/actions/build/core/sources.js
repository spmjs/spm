var path = require('path');
var fs = require('fs');
var tar = require("tar");
var zlib = require('zlib');
var fsExt = require('../../../utils/fs_ext.js');

var Sources = module.exports = function(isLocal, project) {
  this.isLocal = isLocal;
  this.project = project;
  this.initLocalSources();
};

Sources.prototype.initLocalSources = function() {
  this.sourceDir = path.join(process.env.HOME, '.spm', 'sources');
};

// 根据模块id获取模块内容
Sources.prototype.getModule = function(moduleId, callback, isExtract) {
console.log('fetch module ' + moduleId);
  // TODO read server sources
  var that = this;
  var modulePath = this.getModulePath(moduleId); 
console.log('modulePath-->', modulePath);
  if (fs.existsSync(modulePath)) {
    var moduleCode = fsExt.readFileSync(modulePath);
    callback(null, moduleCode);
  } else if (!isExtract){
    var moduleTarPath = this.getModuleTarPath(moduleId);
console.log('find moduleTarPath-->' + moduleTarPath, fs.existsSync(moduleTarPath))
    if (fs.existsSync(moduleTarPath)) {
      console.log(1, moduleTarPath, path.dirname(moduleTarPath))
      fs.createReadStream(moduleTarPath)
        .pipe(zlib.Unzip())
        .pipe(tar.Extract({path: path.dirname(moduleTarPath)}))
        .on("error", function (er) {
          console.error("error here")
        })
        .on("end", function () {
          var tar = path.basename(moduleTarPath);
          var name = tar.slice(0, tar.indexOf('.tar.gz'));
          var extractPath = path.join(path.dirname(moduleTarPath), name);
          fsExt.copydirSync(extractPath, path.join(extractPath, '..'));
          //fs.rmdirSync(extractPath);
          that.getModule(moduleId, callback);
        });
    } else {
      callback('load module ' + moduleTarPath + ' error!');
    }
  } else {
    callback('err');
  }
};

/**
 * moduleId: jquery/1.7.2/jquery
 * moduleName: jquery
 * version: 1.7.2
 * moduleTar = jquery.tar.gz
 * =========
 * moduleId: alipay/xbox/1.0.0/xbox
 * moduleName: xbox
 * version: 1.0.0
 * moduleTar: xbox.tar.gz
 *
 */
Sources.prototype.getModuleTarPath = function(moduleId) {
  if (moduleId.indexOf('#') === 0) {
    moduleId = moduleId.slice(1);
  }
  var moduleDir = moduleId;
  while (/(?:\d+\.){2}\d+(?:-dev)?/.test(path.dirname(moduleDir))) {
    moduleDir = path.dirname(moduleDir);
  }
  var version = path.basename(moduleDir);
  var moduleName = path.basename(path.join(moduleDir, '..'));
  var moduleTar = moduleName + '.tar.gz';
console.log('tar-->', moduleId, moduleDir, moduleTar);
  return path.join(this.sourceDir, moduleDir, moduleTar);
};

/**
 * moduleId: jquery/1.7.2/jquery
 * modulePath = jquery/1.7.2/dist/jquery.js
 * =========
 * moduleId: alipay/xbox/1.0.0/xbox
 * modulePath: alipay/xbox/1.0.0/dist/xbox.js
 *
 */
Sources.prototype.getModulePath = function(moduleId) {
  var moduleDir = path.dirname(moduleId);
  var filename = path.basename(moduleId);
  if (filename.lastIndexOf('.js') !== (filename.length - 3)) {
    filename += '.js';
  }
  return path.join(this.sourceDir, moduleDir, 'dist', filename);
};

