var async = require('async');
var path = require('path');

var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('cmd');

// 项目文件合并输出.
plugin.run = function(project, callback) {
  this.project = project;
  var output = project.output;
  var dist = project.distDirectory;
  var that = this;
  
  _.keys(output).forEach(function(key, value) {
    // 如果不存在 debug 文件，产生 debug 文件 
  });



};
