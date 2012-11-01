// 比较负责的output规则和后续对output额外解析规则都由这个插件来处理.
var path = require('path');

var moduleHelp = require('../../utils/module_help.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;

exports.run = function(project) {
  var output = project.output;
  var that = this;

  Object.keys(output).forEach(function(o) {
    var rule = output[o];
    var new_rule;
    var new_includes;
    if (typeof rule === 'object' && rule.main && rule.includes) {
      // find need rule
      new_rule = {};
      includes = rule.includes;
      new_includes = [];

      // find wildcard '.' and '*' .
      includes.forEach(function(mod) {
        if (/^\s*(\.|\*)\s*$/.test(mod)) {
           [].splice.apply(new_includes, [new_includes.length, 0].concat(getDeps(rule.main, mod)));
        } else {
          new_includes.push(mod);
        }
      });

      if (rule.excludes) {
        new_rule.includes = new_includes;
        new_rule.excludes = rule.excludes;
      } else {
        new_rule = new_includes;
      }
      output[o] = new_rule;
    }
  });

  function getDeps(mod, mergeRule) {
    var deps = project.getDepMapping(mod) || [];
    var newDeps = [];

    deps.filter(function(dep) {
      if (isRelative(dep)) {
        newDeps.push(normalize(dep));
      } else {
        if (/\*/.test(mergeRule)) {
          newDeps.push(dep);
        }
      }
    });

    newDeps.push(normalize(mod));
    return newDeps;
  }
};


