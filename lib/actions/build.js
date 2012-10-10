// spm 核心模块
// TODO 尝试去加载package.json文件，如果发现package.json则启动标准项目.
//      如果没有package.json则启动项目参数解析插件，去解析对应的参数和目录内容
//      构成非标准项目对象。

var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');

var ActionFactory = require('../core/action_factory.js');
var Action = require('../core/action.js');
var PluginConfig = require('../core/plugin_config.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var Build = ActionFactory.create('Build');

Build.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('BUILD CMD MODULE');
  opts.add('only', 'only execute current phrase plugin');
  opts.add('global-config', 'use user custom config');
  opts.add('src', 'set src directory');
  opts.add('dist', 'set dist directory');
  opts.add('version', 'set module version');
  opts.add('so', 'set module version');
  opts.add ('source-files', 'set directory which need to compile.');
  opts.add('throwErrorOnDepNotFound', 'throw error when dependencies not found.');
  opts.add('with-debug', 'add debug file.');

  opts.defaultValue('throwErrorOnDepNotFound', false);
  opts.defaultValue('source-files', null);
  opts.defaultValue('with-debug', 'debug');
  opts.type('throwErrorOnDepNotFound', 'boolean');
  opts.type('version', 'string');
  opts.type('dist', 'string');
  opts.type('src', 'string');
  opts.type('with-debug', 'string');
}

Build.prototype.run = function(callback) {
  var that = this;
  var action = this.name;

  // build is proxy action.
  console.info('Scanning for projects...');

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel(action, process.cwd(), function(projectModel) {

    console.info('');
    console.segm();
    console.info('Building ' + projectModel.name + ' ' + projectModel.version);
    console.segm();

    that.execute(projectModel, function(err) {
      if (err) {
        console.segm();
        console.error(action.toUpperCase() + ' ERROR!');
        console.segm();
        process.exit(1);
      } else {
        console.segm();
        console.info(action.toUpperCase() + ' SUCCESS!');
        console.segm();
      }
      callback && callback(projectModel);
    });
  });
};

Build.prototype.execute = function(projectModel, callback) {
  this.runPlugins(projectModel, callback);
};
// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

module.exports = Build;
