'use strict';

var path = require('path');
var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

var install = module.exports = Plugin.create('install');

// 安装项目到缓存.
install.run = function(project, callback) {
  var root = project.root;
  if (root === '#') {
    root = '';
  }

  var baseModuleDir = path.join(root, project.name, project.version);
  var sourceDir = path.join(project.baseSourcePath, baseModuleDir);

  fsExt.mkdirS(sourceDir);

  if (project.distDirectory != sourceDir) {
    fsExt.copydirSync(project.distDirectory, sourceDir);
  }

  // copy package.json
  if (fsExt.existsSync(path.join(project.baseDirectory, 'package.json'))) {
    fsExt.copyFileSync(project.baseDirectory, sourceDir, 'package.json');
  }
  callback();
};
