var path = require('path');
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var request = require('request');
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
  writeResourceFile(ruleHandler.project, filename, includes, callback);
};

function writeResourceFile(project, outputFilename, includes, cb) {
  var resourceFile = [];
  var dist = project.distDirectory;
  var build = project.buildDirectory;

  outputFilename = path.join(dist, outputFilename);

  // 文件路径
  fsExt.mkdirS(path.dirname(outputFilename));

  if (_.isArray(includes)) {
    includes = includes[0];
  }

  if (isHttpFile(includes)) {
    var fileStream = fs.createWriteStream(path.join(dist, outputFilename));
    fileStream.on('end', function() {
      cb();
    });
    request(includes).pipe(fileStream);
  
  } else {
    fsExt.copyFileSync(outputFilename, build, includes);
    cb();
  }
}

// 输出资源文件
function writeResourceFile1(project, filename, includes) {
  if (util.isArray(includes)) {
    includes = includes[0];
  }

  var src = project.srcDirectory;
  var dist = project.distDirectory;

  mkdir('-p', path.dirname(path.join(dist, filename)));
  cp(path.join(src, includes), path.join(dist, filename));
}

function isHttpFile(f) {
  return f.indexOf('http') == 0;
};

module.exports = resRule;
