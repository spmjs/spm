
// 清除工作空间，build, temp目录.
var path = require('path');
var fsExt = require('../utils/fs_ext.js');

var Plugin = require('../core/plugin.js');
var cleanPlugin = module.exports = Plugin.create('clean');

cleanPlugin.run = function(callback) {
  fsExt.rmdirRF(this.project.buildDirectory);
  fsExt.rmdirRF(path.join(this.project.baseDirectory, '_temp'));
  callback();
};
