var path = require('path');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');

var normalize = moduleHelp.normalize;
var isJs = moduleHelp.isJs;
var jsMergeRule = require('./jsMergeRule.js');

// 默认合并规则基类.
var rule = Rule.createRule('JsCompositeMergeRule');
rule.check = function(filename, includes) {
  return isJs(filename) &&
    (typeof includes === 'object') &&
    (includes.excludes || includes.includes);
};

rule.output = jsMergeRule.output;

rule.getIncludes = function(handler, filename, includes, callback) {
  var project = handler.project;
  var build = project.buildDirectory;

  var ext = path.extname(filename);

  var excludes = moduleHelp.globMods(includes.excludes, project.buildDirectory);
  var globalExcludes = handler.globalExcludes;

  handler.find(filename, includes.includes, function(rule) {
    rule.getIncludes(handler, filename, includes.includes, function(_includes) {
      console.log(_includes);
      _includes = _includes.filter(function(include) {
        console.log('excludes --->', include, isInclude(build, include, excludes, ext));
        console.log('global excludes --->', include, isInclude(build, include, globalExcludes, ext));
        return !(isInclude(build, include, excludes, ext) ||
            isInclude(build, include, globalExcludes, ext));
      });
      console.log('filted includes:', _includes);
      callback(_includes);
    });
  });
};

// 根据用户
function isInclude(build, include, excludes) {

  if (excludes.indexOf(include) > -1) return true;

  // filter excludes

  excludes = excludes.map(function(exclude) {
    if (moduleHelp.isRelative(exclude, build)) {
      exclude = moduleHelp.normalizeRelativeMod(exclude);
    }
    return exclude;
  });
  
  if (moduleHelp.isRelative(include, build)) {
    include = moduleHelp.normalizeRelativeMod(include);
  }

  return excludes.indexOf(include) > -1;
}

module.exports = rule;
