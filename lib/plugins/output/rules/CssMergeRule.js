var Rule = require('../rule.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

var isCss = moduleHelp.isCss;

// 默认合并规则基类.
var cssRule = Rule.createRule('CssRule');

cssRule.check = function(filename, includes) {
  return isCss(filename) && includes !== '.';
};

cssRule.getIncludes = function(handler, filename, includes, callback) {
  if (typeof includes === 'string') {
    if (includes === 'default' || includes === '.') {
      includes = filename;
    }

    includes = [includes];
  }
  callback(includes);
};

cssRule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var build = project.buildDirectory;
  var dist = project.distDirectory;

  var resDirPath = path.join(dist, filename);
  var outputFilePath = path.join(build, filename);
  var codes = [];

  includes.forEach(function(include) {
    codes.push(fsExt.readFileSync(build, include));
  });

  if (project.debugName) {
    var debugOutputFilePath = path.join(dist,
          moduleHelp.getBaseModule(filename) + '-' + project.debugName + '.css');
    fsExt.writeFileSync(debugOutputFilePath, codes.join('\n'));
  }

  fsExt.writeFileSync(outputFilePath, codes.join('\n'));

  cleanCss(outputFilePath, function(code) {
    fsExt.writeFileSync(resDirPath, code);
    callback();
  });
}


module.exports = cssRule;

