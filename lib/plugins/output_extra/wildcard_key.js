// "output": {
//    "**/*": "default",
//    "**/plugin/*.js": "default"
// }
//
// 如果对于某个目录的所有js作为模块输出，可以在key中增加通配符。
// 具体语法参看 https://github.com/isaacs/node-glob

var path = require('path');
var util = require('util');
var shelljs = require('shelljs');
var fsExt = require('../../utils/fs_ext.js');

exports.run = function(project) {
  var that = this;
  var output = project.output;
  var build = project.buildDirectory;

  Object.keys(output).forEach(function(o) {
    var rule = output[o];
    if (/\*(?:\.js|\.css)?$/.test(o) &&
         (util.isArray(rule) || typeof rule === 'string')) {
      delete output[o];

      // 如果不存在默认是 js 模块。
      if (!path.extname(o)) {
        o += '.js';
      }
      
      fsExt.globFiles(o, build).forEach(function(key) {
        if (!output[key]) {
          output[key] = rule;
        }
      });
    }
  });
};
