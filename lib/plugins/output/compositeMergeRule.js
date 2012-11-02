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
  var output = project.output;
  var excludes = fsExt.globFiles(includes.excludes || [], project.buildDirectory);
  var globalExcludes = handler.globalExcludes;

  handler.find(filename, includes.includes, function(rule) {
    rule.getIncludes(handler, filename, includes.includes, function(_includes) {
      console.log(_includes);
      _includes = _includes.filter(function(include) {
        console.log('----', include, excludes.indexOf(include), globalExcludes.indexOf(include));
        return excludes.indexOf(include) < 0 &&
          globalExcludes.indexOf(include) < 0;
      });
      console.log('filted includes:', _includes);
      callback(_includes);
    });
  });
};

module.exports = rule;
