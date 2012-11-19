// 主要是支持多个文件的合并，比如可以
//
// "main.js": "src/*.js"
//
// 我们这个插件可以把他解析成类似的
//
// "main.js": ["src/a.js", "src/b.js", "src/c.js"]
//
// 具体统配规则语法参看 https://github.com/isaacs/node-glob

var path = require('path');
var util = require('util');
var fsExt = require('../../utils/fs_ext.js');

exports.run = function(project) {
  var that = this;
  var output = project.output;
  var build = project.buildDirectory;
  Object.keys(output).forEach(function(o) {
    var rule = output[o];
    if (util.isArray(rule) && rule.length === 1) {
      rule = rule[0];
    }

    var reg = /\*(\.js|\.css)?$/;
    if (typeof rule === 'string' && rule !== '*' && reg.test(rule)) {
      var typeReg = new RegExp('\\.' + project.type + '$');

      // 删除后缀，因为glob处理后缀有问题.
      if (typeReg.test(rule)) {
        rule = rule.slice(0, rule.indexOf(path.extname(rule)));
      }

      output[o] = fsExt.globFiles(rule, build).filter(function(f) {
        return typeReg.test(f);
      }, true);
    }
  });
};
