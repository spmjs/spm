
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。

var path = require('path');
var fs = require('fs');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var cleanCss = require('../compress/clean_css.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;

var Plugin = require('../core/plugin.js');

var cssOutputPlugin = module.exports = Plugin.create('cssOutput');

// 项目文件合并输出.
cssOutputPlugin.run = function(project, callback) {

  // 如果单独执行，那么默认用户的源码目录作为处理目录.
  if (this.argv._[2] === 'output') {
    fsExt.copydirSync(project.srcDirectory, project.buildDirectory);
  }

  var output = project.output;

  // 如果没有配置output, 默认把build目录copy到dist目录.
  if (!output || Object.keys(output).length === 0) {
    fsExt.copydirSync(project.buildDirectory, project.distDirectory);
    callback();
    return;
  }

  fsExt.copydirSync(project.buildDirectory, project.distDirectory);
  callback();
};
