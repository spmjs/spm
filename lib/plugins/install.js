var path = require('path');
var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

var install = module.exports = Plugin.create('install');

// 安装项目到缓存.
install.run = function(callback) {
  var project = this.project;
  var sourceDir = path.join(project.baseSourcePath, project.baseModuleDir);

  fsExt.mkdirS(sourceDir);
  fsExt.copydirSync(project.distDirectory, sourceDir);
  callback();
};


