
// spm 核心模块

var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');

var ActionFactory = require('../core/action_factory.js');
var PluginFactory = require('../core/plugin_factory.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var build = ActionFactory.create('build');
var opts = build.opts;
opts.help('BUILD CMD MODULE \nusage: spm build [options]');
opts.add('only', 'only execute current phrase plugin');
opts.add('global-config', 'use user custom config');
opts.add('src', 'set src directory');
opts.add('dist', 'set dist directory');
opts.add('version', 'set module version');

opts.type('version', 'string');
opts.type('dist', 'string');
opts.type('src', 'string');

build.run = function(callback) {
  var instance = this;
  var options = this.options;

  // build is proxy action.

  var action = 'build';
  console.info('Scanning for projects...');

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel('build', process.cwd(), function(projectModel) {

    console.info('');
    console.segm();
    console.info('Building ' + projectModel.name + ' ' + projectModel.version);
    console.segm();


    execute(projectModel, function(err) {
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

var execute = function(projectModel, callback) {
  var argv = opts.argv;
  var plugins = build.plugins; 

  // add clean plugin
  plugins.push(PluginFactory.getPlugin('clean'));

  build.runPlugins(projectModel, callback);
};
// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

module.exports = build;
build.execute = execute;
