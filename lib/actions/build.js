
// spm 核心模块

var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');

var ActionFactory = require('./action_factory.js');
var PluginFactory = require('../core/plugin_factory.js');
var Opts = require('../utils/opts.js');

// 工具类加载
var StringUtil = require('../utils/string.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var Build = ActionFactory.create('Build');
var opts = Build.opts;
opts.help('BUILD CMD MODULE \nusage: spm build [options]');
opts.add('only', 'only execute current phrase plugin');
opts.add('global-config', 'use user custom config');
opts.add('src', 'assign src directory');
opts.add('dist', 'assign dist directory');

Build.prototype.run = function(callback) {
  var instance = this;
  var options = this.options;

  // build is proxy action.
  var action = process.argv[2];

  console.info('Scanning for projects...');

  var argv = Opts.get(action).argv;

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel(argv, process.cwd(), function(projectModel) {

    console.info('');
    console.segm();
    console.info('Building ' + projectModel.name + ' ' + projectModel.version);
    console.segm();

    var plugins = PluginFactory.getPlugins(action);
    // add clean plugin
    plugins.push('clean');

    executePlugins(plugins, projectModel, argv, function(err) {
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

var executePlugins = function(plugins, projectModel, argv, callback) {
  async.mapSeries(plugins, function(pluginName, callback) {
    var plugin = require('../plugins/' + pluginName + '.js');
    callback(null, function(callback) {
      plugin.execute(projectModel, argv, callback);
    }); 
  }, function(err, plugins) {
    if (err) {
      throw new Error(err);
    }
    async.series(plugins, function(err) {
      callback(err);
    });
  });
};
// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

module.exports = Build;

module.exports.executePlugins = executePlugins;
