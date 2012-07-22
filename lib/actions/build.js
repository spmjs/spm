
// spm 核心模块

var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');

var ActionFactory = require('./action_factory.js');

// 工具类加载
require('../utils/colors.js');
var StringUtil = require('../utils/string.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('./build/core/project_factory.js');

var Build = ActionFactory.create('Build');

Build.prototype.run = function(callback) {
  var instance = this;
  var options = this.options;
  var action = 'build';

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel(action, process.cwd(), function(projectModel) {
    async.mapSeries(projectModel.plugins, function(pluginName, callback) {
      var plugin = require('./build/plugins/' + pluginName + '.js');
      callback(null, async.apply(plugin, projectModel));
    }, function(err, plugins) {
      if (err) {
        throw new Error(err);
      }
      async.series(plugins, function(err) {
        if (err) {
          console.log('');
          console.error('  The command' + action + ' execution failed!');
          console.log('');
        } else {
          console.log('');
          console.log('  The command ' + action + ' completed successfully!');
          console.log('');
        }
        callback && callback();
      });
    });
  });
};

// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

module.exports = Build;
