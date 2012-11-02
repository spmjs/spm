var path = require('path');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');

// 默认合并规则基类.
var resRule = Rule.createRule('ResourceDirectoryRule');

resRule.check = function(filename, includes) {
  return /^[_\w-]+$/.test(filename);
};

resRule.getIncludes = function(handler, filename, includes, callback) {
  callback(includes);
};

resRule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var output = ruleHandler.output;

  writeResourceFile(project, filename, includes);
  callback();
};

// 输出资源文件
// 目前规则暂时简单点. 只支持有限的通配符，和目录深度。或者就是完全匹配正则.
// 'sites': ['sites/*.js'] 把sites/*.js目录中的文件copy到 sites目录.
function writeResourceFile(project, outputFilename, includes) {
  var resourceFile = [];
  var dist = project.distDirectory;

  var resDirPath = path.join(dist, outputFilename);
  if (includes === 'default') {
    fsExt.writeFileSync(resDirPath, project.getModuleCode(outputFilename));
  } else {

    // 文件路径
    fsExt.mkdirS(resDirPath);

    if (typeof includes === 'string') {
      includes = [includes];
    }

    includes.forEach(function(include) {
      resourceFile = resourceFile.concat(getResourceFile(project,
          include));
    });
    var build = project.buildDirectory;
    resourceFile.forEach(function(filename) {
      fsExt.writeFileSync(path.join(dist, filename), project.getModuleCode(filename));
    });
  }
}

function getResourceFile(project, filename) {

  return fsExt.globFiles(filename, project.buildDirectory).filter(function(f) {
    return path.extname(f) !== '';
  });
}
module.exports = resRule;

