// 源文件copy, 把源文件copy到工作目录。
// 支持filter功能，可以针对指定的文件进行过滤和替换
// TODO 过滤和基本的项目信息替换. %version%
// TODO 对过滤的关键字 toUpperCase();

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var resources = module.exports = Plugin.create('resources', function(project, callback) {
  var that = this;
  var src = project.srcDirectory;
  var code;

  if (!fsExt.existsSync(src) || fsExt.list(src).length === 0) {
    throw new Error('Nothing in ' + src + '!, please check');
  }
  var build = project.buildDirectory;

  if (project.getConfig('filter')) {
    files = fsExt.list(src, /js$|css$/).forEach(function(file) {
      code = that.filterCode(fsExt.readFileSync(path.join(src, file)));
      fsExt.writeFileSync(path.join(build, file), code);
    });

  } else {
    fsExt.copydirSync(src, build);
  }
  callback();
});

// 支持用户传入自定义数据对象进来替换.
resources.param('data', {});

resources.filterCode = function(code) {
  var data = this.data;
  var project = this.project;
  return this.replace(code, function(param) {
    return data[param] || project[param] ||
       data[param.toLowerCase()] || project[param.toLowerCase()];
  });
};

