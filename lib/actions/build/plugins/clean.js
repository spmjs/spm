
// 清除工作空间.
var path = require('path');
var fsExt = require('../../../utils/fs_ext.js');

/**
 * 清除工作空间，build目录.
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {
  fsExt.rmdirRF(project.buildDirectory);
  fsExt.rmdirRF(path.join(project.baseDirectory, '_temp'));
  console.info('');
  console.info('  Successfully clean temp directory!');
  console.info('');
  callback();
};
