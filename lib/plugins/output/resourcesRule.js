var path = require('path');
var util = require('util');
require('shelljs/global');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');

// 默认合并规则基类.
var resRule = Rule.createRule('ResourcesRule');

resRule.check = function(filename, includes) {
  var ext = path.extname(filename);
  return ext && !/js|css$/.test(ext);
};

resRule.getIncludes = function(handler, filename, includes, callback) {
  if (/^\.|\*$/.test(includes)) {
    callback(filename);
  } else {
    callback(includes);
  }
};

resRule.output = function(ruleHandler, filename, includes, callback) {
  writeResourceFile(ruleHandler.project, filename, includes);
  callback();
};

// 输出资源文件
function writeResourceFile(project, filename, includes) {
  if (util.isArray(includes)) {
    includes = includes[0];
  }

  var src = project.srcDirectory;
  var dist = project.distDirectory;

  mkdir('-p', path.dirname(path.join(dist, filename)))
  cp(path.join(src, includes), path.join(dist, filename));
}

module.exports = resRule;
