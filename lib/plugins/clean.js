
// 清除工作空间.
var path = require('path');
var fs = require('fs');
var fsExt = require('../utils/fs_ext.js');

var Plugin = require('../core/plugin.js');
var cleanPlugin = module.exports = Plugin.create('clean');

/**
 * 清除工作空间，build目录.
 * @param {Object} project 项目模型信息.
 */
cleanPlugin.run = function(callback) {
  fsExt.rmdirRF(this.project.buildDirectory);
  fsExt.rmdirRF(path.join(this.project.baseDirectory, '_temp'));
  if (this['without-debug']) {
    var dist = this.project.distDirectory;
    fsExt.listFiles(dist, /-debug\.js/).forEach(function(f) {
      fs.unlinkSync(f);
    });
  }
  callback();
};

cleanPlugin.param('without-debug', false);

