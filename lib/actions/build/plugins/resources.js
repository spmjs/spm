// 源文件copy, 把源文件copy到工作目录。
// 后续可以支持filter功能，可以针对指定的文件进行过滤和替换

// TODO 过滤和基本的项目信息替换.

var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');

/**
 * 根据项目不同的类型，可能有基本不同的过滤规则。
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {
  fsExt.copyDirSync(project.srcDirectory, project.buildDirectory);
  console.log('');
  console.log('  Successfully execute plugin resources!');
  console.log('');
  callback();
};
