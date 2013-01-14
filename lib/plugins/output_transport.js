'use strict';

var path = require('path');
var async = require('async');
var _ = require('underscore');

var resourcesRule = require('./output/resourcesRule.js')

var Plugin = require('../core/plugin.js');
var moduleHelp = require('../utils/module_help.js');
var fsExt = require('../utils/fs_ext.js');
var depUtil = require('../utils/dependences');

var plugin = module.exports = Plugin.create('output_transport');

// 项目文件合并输出.
plugin.run = function(project, callback) {
  this.project = project;
  var that = this;
  var output = project.output;

  if (_.isEmpty(output)) {
    this.createDefaultOutput(project);
  }

  async.series([
    function(cb) {
      // 加载全局插件.
      that.writeModule(cb);
    },    
    function(cb) {
      that.debugModule(cb);
    },
    function(cb) {
      that.cmdModule(cb);
    },
    function(cb) {
      that.output(cb);
    }
  ], function() {
    callback();
  });

};

plugin.writeModule = function(callback) {
  var project = this.project;
  var output = project.output;

  async.forEach(_.keys(output), function(key, cb) {
    var value = output[key];

    if (_.isArray(value)) {
      value = value[0];
    }

    if (value === '.' || value === '*') {
      value = key;
    }

    resourcesRule.writeResourceFile(project, key, value, cb);
  }, function() {
    callback();    
  });
};

// 检查并输出 debug 模块
plugin.debugModule = function(callback) {
  var project = this.project;
  var build = project.buildDirectory;
  var debug = getDebug(project);

  var output = project.output;
  var isJs = moduleHelp.isJs;
  var getDebugModule = moduleHelp.getDebugModule; 
  var hasDebugModule = false;

  _.keys(output).forEach(function(name) {
    if (!isJs(name)) return;
    var debugModuleName =  moduleHelp.getDebugModule(name, debug);
    var debugModulePath = path.join(build, debugModuleName);

    if (fsExt.existsSync(debugModulePath)) {
      hasDebugModule = true;
    } else {
      fsExt.copyFileSync(path.join(build, name), debugModulePath);
    }
  });

  if (hasDebugModule) {
    // 第三方模块存在 压缩模块.禁止后续的压缩.
    project.addConfig('skip-min', true); 
  }
  callback();
};

// 对模块进行 cmd 标准化.
plugin.cmdModule = function(callback) {
  var project = this.project;
  var build = project.buildDirectory;
  var debug = getDebug(project);

  fsExt.list(build, /\.js$/).forEach(function(moduleName) {
    var moduleId = project.getModuleId(moduleName);
    var modulePath = path.join(build, moduleName);
    var moduleCode = fsExt.readFileSync(modulePath);

    if (isDebugMod(moduleName, debug)) {
      moduleCode = moduleHelp.filterRequire(project, moduleCode, debug);
    } else {
      moduleCode = moduleHelp.filterRequire(project, moduleCode, '');
    }

    var deps = depUtil.parseDynamic(moduleCode);
    deps = _.uniq(deps);
    moduleCode = moduleHelp.filterIdAndDeps(moduleCode, moduleId, deps);

    fsExt.writeFileSync(modulePath, moduleCode);
  });
  callback();
};

plugin.output = function(callback) {
  var project = this.project;
  fsExt.copydirSync(project.buildDirectory, project.distDirectory);
  callback();
};

plugin.createDefaultOutput = function() {
  var output = {};
  output[project.name + '.js'] = '.';
  this.project = output;
};

function getDebug(project) {
  var debug = project.debugName;

  if (debug) {
    debug = '-' + debug;
  }
  return debug;
}

function isDebugMod(moduleName, debug) {
  if (!debug) {
    return false;
  }

  return new RegExp(debug + '\\.js').test(moduleName);
}
