var path = require('path');
var async = require('async');
var Rule = require('./rule.js');
require('shelljs/global');

var fsExt = require('../../utils/fs_ext.js');
var StringUtils = require('../../utils/string.js');
var moduleHelp = require('../../utils/module_help.js');
var Sources = require('../../core/sources.js');
var DebugModule = require('./debug_module.js');

var isCss = moduleHelp.isCss;
var isRelative = moduleHelp.isRelative;

// 默认合并规则基类.
var cssRule = Rule.createRule('CssRule');

cssRule.check = function(filename) {
  return isCss(filename);
};

cssRule.getIncludes = function(handler, filename, includes, callback) {
  if (typeof includes === 'string') {
    if (/^(?:default|\.|\*)$/.test(includes)) {
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

  // 如果用户输出目录.
  mkdir('-p', path.dirname(resDirPath));

  var codeList = [];

   // debug 文件处理模块.
  var debugModule = new DebugModule(project);

  async.forEachSeries(includes, function(include, callback) {
    if (/\w+/.test(include)){
      // 存在别名替换.
      include = project.getGlobalModuleId(include, true);
    }

    if (moduleHelp.isRelative(include, build)) {
      include = './' + include;
    }

    if (isHttpFile(include)) {
      include = StringUtils.tmpl(include, project);

      Sources.loadUrl(include, function(body) {
        if (body) {
          codeList.push(body);
          debugModule.addCode(body, callback);
        } else {
          callback();
        }
      });
      return;
    }

    // css 合并全局模块，必须添加后缀. 
    if (path.extname(include) !== 'css' && include.indexOf('/') < -1) {
      throw new Error('Illegal dependnecies ' + include + ':' + gId);    
    }

    if (include.indexOf('.') === 0) {
      codeList.push(fsExt.readFileSync(build, include));
      debugModule.addRelaModule(include, [], function() {
        callback();
      });
    } else {
      async.series([
        function(callback) {
          debugModule.addGlobalModule(include, function() {
            callback();
          });
        }, function(callback) {
          project.getGlobalModuleCode(include, function(code) {
            codeList.push(code);
            callback();
          });
        }
      ], function() {
        callback();
      });
    }

  }, function() {
    var codes = codeList.join('\n');
    var moduleFile = path.join(project.distDirectory, filename);
    fsExt.writeFileSync(moduleFile, codes);

    debugModule.output(moduleFile, function() {
      callback();
    });
  });
};

function isHttpFile(f) {
  return f.indexOf('http') === 0;
};

module.exports = cssRule;
