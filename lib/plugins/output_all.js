'use strict';

var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('output_all');

// 直接输出源文件目录到 dist 目录。
plugin.run = function(project, callback) {
  var src = project.srcDirectory;
  var dist = path.join(project.distDirectory, 'template');

  fsExt.mkdirS(dist);

  fsExt.copydirSync(src, dist);
  callback();
};
