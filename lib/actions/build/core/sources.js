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
  var modulePath = path.join(this.sourceDir, moduleId);
  if (fs.existsSync(modulePath)) {
    var moduleCode = fsExt.readFileSync(modulePath);
    callback(null, moduleCode);
  } else if (!isExtract){
    var moduleTar = this.getModuleTar(moduleId);
console.log('find moduleTar-->' + moduleTar, fs.existsSync(moduleTar))
    if (fs.existsSync(moduleTar)) {
      console.log(1, moduleTar, path.dirname(moduleTar))
      fs.createReadStream(moduleTar)
        .pipe(zlib.Unzip())
        .pipe(tar.Extract({path: path.dirname(moduleTar)}))
        .on("error", function (er) {
          console.error("error here")
        })
        .on("end", function () {
            that.getModule(moduleId, callback);
        });
    } else {
      callback('load module ' + moduleTar + ' error!');
    }
  } else {
    callback('err');
  }
};

/**
 * moduleId: jquery/1.7.2/jquery
 * relaDir: jquery/1.7.2
 * moduleName: jquery
 * version: 1.7.2
 * moduleTar = jquery-1.7.2.tar.gz
 * =========
 * moduleId: alipay/xbox/1.0.0/xbox
 * relaDir: alipay/xbox/1.0.0
 * moduleName: xbox
 * version: 1.0.0
 * moduleTar: xbox-1.0.0.tar.gz
 *
 */
Sources.prototype.getModuleTar = function(moduleId) {
  if (moduleId.indexOf('#') === 0) {
    moduleId = moduleId.slice(1);
  }
  var relaDir = path.dirname(moduleId);
  var moduleDir = path.join(path.dirname(moduleId), '..');
  var moduleName = path.basename(moduleDir);
  var version = path.basename(relaDir);
  var moduleTar = moduleName + '-' + version + '.tar.gz';
//console.log('tar-->', moduleId, relaDir, moduleName, version, moduleTar);
  return path.join(this.sourceDir, moduleDir, moduleTar);
};

