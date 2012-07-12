
// 清除工作空间.

var fsExt = require('../utils/fs_ext.js');

/**
 * 清除工作空间，build目录.
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {
  fsExt.rmdirRF(project.buildDirectory);
  console.log('');
  console.log('  Successfully clean project!');
  console.log('');
  callback();
};
