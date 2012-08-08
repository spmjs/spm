
// 清除工作空间.
var path = require('path');
var fsExt = require('../../../utils/fs_ext.js');

var Plugin = require('../core/plugin.js');
var plugin = module.exports = Plugin.create('clean');

/**
 * 清除工作空间，build目录.
 * @param {Object} project 项目模型信息.
 */
plugin.run = function(callback) {
  fsExt.rmdirRF(this.project.buildDirectory);
  fsExt.rmdirRF(path.join(this.project.baseDirectory, '_temp'));
  callback();
};
