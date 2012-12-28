var path = require('path');
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var request = require('request');
require('shelljs/global');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var StringUtils = require('../../utils/string.js');
var moduleHelp = require('../../utils/module_help.js');

// 默认合并规则基类.
var resRule = Rule.createRule('ResourcesRule');

resRule.check = function(filename, includes) {
  var ext = path.extname(filename);
  return ext && !(moduleHelp.isJs(filename) || moduleHelp.isCss(filename))
};

resRule.getIncludes = function(handler, filename, includes, callback) {
  if (/^\.|\*$/.test(includes)) {
    callback(filename);
  } else {
    callback(includes);
  }
};

resRule.output = function(ruleHandler, filename, includes, callback) {
  writeResourceFile(ruleHandler.project, filename, includes, callback);
};

var writeResourceFile = resRule.writeResourceFile = function(project, outputFilename, includes, cb) {
  var resourceFile = [];
  var dist = project.distDirectory;
  var build = project.buildDirectory;
  outputFilename = path.join(dist, outputFilename);

  // 文件路径
  fsExt.mkdirS(path.dirname(outputFilename));

  if (_.isArray(includes)) {
    includes = includes[0];
  }

  if (moduleHelp.isUrl(includes)) {
    includes = StringUtils.tmpl(includes, project);
    var fileStream = fs.createWriteStream(outputFilename);

    fileStream.on('close', function() {
      cb();
    });
    
    request(includes).pipe(fileStream);
  
  } else {
    fsExt.copyFileSync(path.join(build, includes), outputFilename);
    cb();
  }
}

module.exports = resRule;
