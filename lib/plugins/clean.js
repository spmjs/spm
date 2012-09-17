
// 清除工作空间，build, temp目录.
var path = require('path');
var fsExt = require('../utils/fs_ext.js');

var Plugin = require('../core/plugin.js');
var cleanPlugin = module.exports = Plugin.create('clean');

cleanPlugin.run = function(project, callback) {
  fsExt.rmSync(project.buildDirectory);
  fsExt.rmSync(path.join(project.baseDirectory, '_temp'));
  callback();
};
