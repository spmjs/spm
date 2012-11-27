// 比较负责的output规则和后续对output额外解析规则都由这个插件来处理.
var path = require('path');
var _ = require('underscore');

var moduleHelp = require('../../utils/module_help.js');
var fsExt = require('../../utils/fs_ext.js');

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
      var includes = rule.includes;
      new_includes = [];

      if (_.isString(includes)) {
        if (includes === '.' || includes === '*') {
          includes = [includes];
        }

        if (includes === 'default') {
          includes = [rule.main];
        }
      }

      // find wildcard '.' and '*' .
      includes.forEach(function(mod) {
        if (/^\s*(\.|\*)\s*$/.test(mod)) {
           [].splice.apply(new_includes, [new_includes.length, 0].concat(getDeps(rule.main, mod)));
        } else if (/\*/.test(mod)){
           [].splice.apply(new_includes, [new_includes.length, 0].concat(getGlobFiles(project, mod)));
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

  function getGlobFiles(project, rule) {
    return fsExt.globFiles(rule, project.buildDirectory, true);
  }

  function getDeps(mod, mergeRule) {
    var deps = project.getDepMapping(mod) || [];
    var newDeps = [];

    deps.filter(function(dep) {
      if (isRelative(dep)) {
        // dep =  '/' + path.normalize(moduleHelp.getBaseDepModulePath(mod,dep));
        dep =  normalize(moduleHelp.getBaseDepModulePath(mod, dep));
        newDeps.push(dep);
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


