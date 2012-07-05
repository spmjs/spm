
// spm 核心模块

var fs = require('fs');
var util = require('util');
var path = require('path');

var ActionFactory = require('./action_factory.js');

// 工具类加载
require('../utils/colors.js');
var StringUtil = require('../utils/string.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('./build/core/project_factory.js');
var uglifyjs = require('./build/compress/uglify');


var Build = ActionFactory.create('Build');

Build.AVAILABLE_OPTIONS = {
  closure: {
    alias: ['-c', '--closure'],
    description: 'use google Closure Compiler'
  }
};

Build.prototype.run = function() {
  var instance = this;
  var options = this.options;
  var compress = uglifyjs;
  var action = 'build';
  
  if (options.closure) {
    compress = require('./build/compress/closure');
  }

  if (options.dist) {
    action = 'dist';
  }

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel(action, process.cwd());

  projectModel.compress = projectModel.compress || compress;
  var result = execute(projectModel);

  if (result === 0) {
    console.log(action + ' success!');
  } else {
    console.error(action + ' error!');
  }
};

// 执行项目插件。
// TODO 后续支持外部插件加载.
function execute(projectModel) {
  var plugins = projectModel.plugins;
  var len = plugins.length;
  var result = 0;
  var i, plugin;

  for (i = 0; i < len; i++) {
    try {
      plugin = require('./build/plugins/' + plugins[i] + '.js');
      console.log(plugins[i]);
      plugin.execute.apply(null,
          [projectModel].concat(plugin.args || []));
    } catch (e) {
      console.error(e);
      throw new Error(e)
      result = 1;
      // TODO 有些异常可以只是进行错误提示，但是不影响整体打包流程。
      break;
    }
  }
  return result;
}

// TODO 自定义异常。
// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

module.exports = Build;
