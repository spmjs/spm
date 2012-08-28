
/*
 * 插件解析模块
 * 1. 根据项目类型，获取项目生命周期，获取基本的插件列表
 * 2. 根据用户自定义配置，获取用户自定义插件
 * 3. 接受用户对插件的参数配置，收集相应的参数信息，传递给插件。
 * 4. 返回最终的插件列表。
 */

var Opts = require('../utils/opts.js');
var pluginConfig = require('./plugin_config.js')
var Plugin = require('./plugin.js');

/**
 * 获取指定 action 需要执行的插件列表.
 * @param {String} action action.
 * @return {Array} 插件列表.
 */
exports.getPlugins = function(action, only) {
  return pluginConfig.getPlugins(action, only);
};

exports.getPlugin = function(pluginaName) {
  return require('../plugins/' + pluginaName + '.js');
};

module.exports.create = function(name, run) {
  var plugin = new Plugin(name);
     
  if (run) plugin.run = run;
  return plugin;
};

