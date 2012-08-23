
/*
 * 插件解析模块
 * 1. 根据项目类型，获取项目生命周期，获取基本的插件列表
 * 2. 根据用户自定义配置，获取用户自定义插件
 * 3. 接受用户对插件的参数配置，收集相应的参数信息，传递给插件。
 * 4. 返回最终的插件列表。
 */

var Opts = require('../utils/opts.js');
var Lifecycle = require('./lifecycle.js');

/**
 * 获取指定 action 需要执行的插件列表.
 * @param {String} action action.
 * @return {Array} 插件列表.
 */
exports.getPlugins = function(action, slient) {
  var only = Opts.get(action).argv.only;
  var lifecycle = Lifecycle.getLifecycle();
  var currentPhrases = lifecycle.slice(0, indexOf(lifecycle, action) + 1);
  var plugins = [];
  if (currentPhrases.length === 0 && !slient) {
      throw 'Unknown lifecycle phase  ' + action + '!';
  }

  // 在初始化的时候，需要提前获取插件信息，有些action不在插件中心.
  if (currentPhrases.length === 0) {
    return [];
  }

  if (only) {
    plugins = getPlugins(currentPhrases[currentPhrases.length - 1]);
  } else {
    currentPhrases.forEach(function(phrase) {
      [].splice.apply(plugins, [plugins.length,
        0].concat(getPlugins(phrase)));
    });
  }
  return plugins;
};

exports.registerArgs = function(action, opts) {
  var plugins = exports.getPlugins(action, true);
  plugins.forEach(function(pluginName) {
    var plugin = require('../plugins/' + pluginName + '.js');
    plugin.registerArgs(opts);
  });
};

function indexOf(arrs, key) {
    var keys;
    for (var i = 0, len = arrs.length; i < len; i++) {
        keys = Object.keys(arrs[i]);
        if (keys.indexOf(key) > -1) {
            return i;
        }
    }
    return -1;
}

function getPlugins(phrase) {
    return phrase[Object.keys(phrase)[0]];
}
