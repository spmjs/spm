
/*
 * 插件解析模块
 * 1. 根据项目类型，获取项目生命周期，获取基本的插件列表
 * 2. 根据用户自定义配置，获取用户自定义插件
 * 3. 接受用户对插件的参数配置，收集相应的参数信息，传递给插件。
 * 4. 返回最终的插件列表。
 */
var path = require('path');
var Opts = require('../utils/opts.js');
var pluginConfig = require('./plugin_config.js')
var Plugin = require('./plugin.js');

/**
 * 获取指定 action 需要执行的插件列表.
 * @param {String} action action.
 * @return {Array} 插件列表.
 */
exports.getPlugins = function(action, only) {
  var plugins = pluginConfig.getPlugins(action, only);
  if (plugins.length === 0) {
    var plugin = exports.getPlugin(action);
    if (plugin) {
      plugins = [action];
    } 
  }
  return plugins;
};

exports.getPlugin = function(pluginName) {
  // TODO 支持从源中查找.
  var plugin = null;
  var pluginDir = path.join(path.dirname(module.filename), '../plugins');
  try {
    plugin = require(path.join(pluginDir, pluginName + '.js'));
  } catch(e) {
    console.log('not found plugin ' + pluginName);
  }
  return plugin;
};

module.exports.create = function(name, run) {
  var plugin = new Plugin(name);
     
  if (run) plugin.run = run;
  return plugin;
};

