
// 根据用户的action, 分析出插件列表。
// 每一个阶段会有一个模块，负责本阶段插件的参数信息准备调用和处理.

// TODO 用户可以通过配置文件进行覆盖.
var LifeCycle = [{
    'clean': ['clean']
}, {
    'resources': ['resources'] // 代码输出到build目录.
}, {
    'compile': ['coffee', 'less'] // 代码编译.
}, {
    'analyse': ['jshint', 'loadSourceConfig', 'dependencies', 'depCheck'] //依赖分析.
}, {
    'preBuild': ['tpl', 'css', 'define'] // 代码模块规范化.
}, {
    'output': ['output'] // 合并输出.
}, {
    'build': ['compress', 'install'] // 代码压缩和本地缓存.
}, {
    'upload': ['pack', 'upload'] // 代码上传源.
}, {
    'deploy': ['deploy'] // 代码部署.
}];

// 对于某些Action可以指定绑定插件.
var ActionPlugins = {
  
};

/**
 * 获取指定 action 需要执行的插件列表.
 * @param {String} action action.
 * @return {Array} 插件列表.
 */
exports.getPlugins = function(action, only) {
  var currentPhrases = LifeCycle.slice(0, indexOf(LifeCycle, action) + 1);
  var plugins = [];
  if (currentPhrases.length > 0) {
    if (only) {
      plugins = getPlugins(currentPhrases[currentPhrases.length - 1]);
    } else {
      currentPhrases.forEach(function(phrase) {
        [].splice.apply(plugins, [plugins.length,
          0].concat(getPlugins(phrase)));
      });
    }
    return plugins;
  }

  if (ActionPlugins[action]) {
    plugins = ActionPlugins[action];
    if (!Array.isArray(plugins)) {
      plugins = [plugins];
    }
    return plugins;
  }

  return plugins;
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




