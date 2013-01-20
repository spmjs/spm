/*
 * 插件解析模块
 * 1. 根据项目类型，获取项目生命周期，获取基本的插件列表
 * 2. 根据用户自定义配置，获取用户自定义插件
 * 3. 接受用户对插件的参数配置，收集相应的参数信息，传递给插件。
 * 4. 返回最终的插件列表。
 */
// 根据用户的action, 分析出插件列表。
// 每一个阶段会有一个模块，负责本阶段插件的参数信息准备调用和处理.

'use strict';

var path = require('path');
var vm = require('vm');
var async = require('async');
var request = require('request');
var _ = require('underscore');
var npm = require('npm');
var shelljs= require('shelljs');

var pluginConfig = require('./plugin_config.js');
var moduleHelp = require('../utils/module_help.js');
var env = require('../utils/env.js');
var fsExt = require('../utils/fs_ext.js');
var Ast = require('../utils/ast.js');
var DepUtil = require('../utils/dependences.js');
var Plugin = require('./plugin.js');

var lifeCycles = {};

// 加载默认生命周期.
loadLifecycle();

function loadLifecycle(dir) {
  dir = dir || path.dirname(module.filename);
  var lifeCycleDir = path.join(dir, 'lifecycle');
  if (!fsExt.existsSync(lifeCycleDir)) {
    console.warn('加载生命周期模板失败 ' + lifeCycleDir);
    return;
  }

  fsExt.listFiles(lifeCycleDir, /\.js$/).forEach(function(f) {
    var name = path.basename(f).replace('.js', '');
    lifeCycles[name] = require(f);
  });
}

// 默认生命周期.
exports.LifeCycle = lifeCycles['js'];

// 所有的插件可以注册到这里面.
var PluginCenter = exports.pluginCenter = {};

/**
 * 获取指定 action 需要执行的插件列表.
 * TODO 需要从plugins中检查是否需要项目模型.
 * @param {String} action action.
 * @param {String} type project type.
 * @param {boolean} only .
 * @param {Array} userPlugins 用户插件列表.
 * @return {Array} plugins 插件列表.
 */
exports.getPlugins = function(action, type, only, userPlugins) {
  type = type && type.toLowerCase();

  var lifeCycle = lifeCycles[type] || exports.LifeCycle;

  var currentPhrases = lifeCycle.slice(0, indexOf(lifeCycle, action) + 1);
  var plugins = [];
  var plugin;
  if (currentPhrases.length > 0) {
    if (only) {
      plugins = getPlugins(currentPhrases[currentPhrases.length - 1], userPlugins);
    } else {
      currentPhrases.forEach(function(phrase) {
        [].splice.apply(plugins, [plugins.length,
          0].concat(getPlugins(phrase, userPlugins)));
      });
    }
    return plugins;
  }

  // TODO add user plugins.
  plugin = exports.getPlugin(action, action);
  if (plugin) {
    plugins = [plugin];
    return plugins;
  }

  return plugins;
};

exports.getPlugin = function(pluginName, __parent) {
  // TODO 支持从源中查找.
  var plugin = null;
  var pluginDir = path.join(path.dirname(module.filename), '../plugins');
  if (PluginCenter)
  try {
    plugin = require(path.join(pluginDir, pluginName + '.js'));
    plugin.__parent = __parent;
  } catch (e) {
    if (PluginCenter[pluginName]) {
      return PluginCenter[pluginName];
    }
    console.log('not found plugin ' + pluginName);
  }
  return plugin;
};


exports.create = function(name, run) {
  var plugin = new Plugin(name);

  if (run) plugin.run = run;
  return plugin;
};

function getPlugins(phrase, userPlugins) {
  var phraseName = Object.keys(phrase)[0];
  var plugins = phrase[phraseName].map(function(p) {
    return exports.getPlugin(p, phraseName);
  });

  if (userPlugins && userPlugins[phraseName]) {
    var actionPlugins = userPlugins[phraseName];
    if (actionPlugins.before) {
      [].splice.apply(plugins, [0, 0].concat(actionPlugins.before));
    }
    if (actionPlugins.after) {
      [].splice.apply(plugins, [plugins.length, 0].concat(actionPlugins.after));
    }
  }
  return plugins;
}

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

// load user config plugins
exports.initUserPlugins = function(model, callback) {
  var actionPlugins = model.getConfig('plugins') || {};
  async.forEach(Object.keys(actionPlugins), function(actionName, callback) {
    var plugins = actionPlugins[actionName];

    var loadPluginsFn = ['before', 'after'].map(function(pos) {
      if (plugins[pos]) {
        return function(callback) {
          loadPlugins(model, plugins[pos], function(newPlugins) {
            plugins[pos] = newPlugins;
            callback();
          });
        };
      } else {
        return function(callback) {
          callback();
        };
      }
    });

    async.parallel(loadPluginsFn, function() {
      callback();
    });

  }, function(err) {
    if (err) {
      console.error(err);
    }
    callback();
  });
};

// 加载用户配置插件. 如果无法加载的注册到unloadPlugins中.
var loadPlugins = exports.loadPlugins = function(model, plugins, callback) {
  var newPlugins = [];

  if (typeof plugins === 'string') {
    plugins = [plugins];
  }

  async.forEach(plugins, function(plugin, callback) {
    /// callback();
    var errMsg = 'unable to load ' + plugin;
    loadPlugin(model, plugin, function(pluginObj) {
      if (!pluginObj) {
        console.warn(errMsg);
      } else {
        newPlugins.push(pluginObj);
      }
      callback();
    });
  }, function() {
    callback(newPlugins);
  });
   // check user plugins
};

function loadPlugin(model, pluginName, callback) {
  var plugin = null;
  if (env.isAbsolute(pluginName)) {
    if (!fsExt.existsSync(pluginName)) {
      callback(plugin);
    } else {
      var code = fsExt.readFileSync(pluginName);
      try {
        plugin = exports.compile(code, pluginName);
      } catch (e) {
      }
      if (callback) {
        callback(plugin);
      } else {
        return plugin;
      }
    }
  } else if (pluginName.indexOf('http') === 0) {
    request(pluginName, function(err, res, body) {
      if (err) {
        callback(null);
      } else {
        plugin = exports.compile(body, pluginName);
        callback(plugin);
      }
    });
  } else if (PluginCenter[pluginName]) {
    callback(PluginCenter[pluginName]);
  } else if (moduleHelp.isRelative(pluginName)) {
    var filepath = moduleHelp.perfectLocalPath(pluginName);
    filepath = moduleHelp.normalize(filepath);
    loadPlugin(model, filepath, callback);
  } else if (pluginName.indexOf('/') > 0) {
    downloadPlugin(model, pluginName, function(modId, filepath) {
      loadPlugin(model, filepath, callback);
    });
  } else {
    console.warn('not support plugin ' + pluginName);
    callback(null);
  }
}

var downloadPlugin = exports.downloadPlugin = function(model, pluginName, callback) {
  model.getSourceModule(pluginName, function(err, modId, filepath) {
    if (err) {
      callback(null);
    } else {
      callback(modId, filepath);
    }
    console.info('download ' + pluginName + ' success!');
  });
};

// 编译一个插件
exports.compile = function(code, filename) {
  var sandbox = {};
  var _exports = {};
  var _module = {'exports': _exports};
  for (var k in global) {
    sandbox[k] = global[k];
  }
  sandbox.require = require;
  sandbox.exports = _exports;
  sandbox.__filename = filename;
  sandbox.module = _module;
  sandbox.global = sandbox;
  sandbox.Plugin = Plugin;
  sandbox.fsExt = fsExt;
  sandbox.moduleHelp = moduleHelp;
  sandbox.Ast = Ast;
  sandbox.DepUtil = DepUtil;
  vm.runInNewContext(code, sandbox, filename, true);

  return sandbox.module.exports;
};

// 加载 全局插件，允许用户自定义插件生命周期.
// 扫描下载的插件，注册到 PluginCenter 中。
exports.downloadPlugins = function(model, callback) {
  var plugins = model.plugins;
  if (_.keys(plugins).length === 0) {
    callback();
    return; 
  }

  async.forEach(_.keys(plugins), function(key, cb) {
    var p = plugins[key];
    var pId = p.main || p.id || p;
    var config = p.config || {};

    if (/^npm:/.test(pId)) {
      downloadNpmPlugin(model, key, pId, config, cb);
      return;
    }

    downloadPlugin(model, pId, function(modId, filepath) {
      if (!modId) {
        console.warn('下载插件' + modId + '错误!');
        cb();
        return;
      }
       
      // 检查 lifecycle. 允许用户覆盖插件的生命周期.
      if (p.lifecycle) {
        // 重新加载  lifecycle
        loadLifecycle(path.dirname(filepath));
      }

      // 通过 package.json 的 output 来获取插件信息. 只要 output 配置的js 模块，都认为是一个插件.
      loadSubPlugin(key, path.dirname(filepath), config, cb);
      // 插件注册到 PluginCenter 中 key/name 的形式注册.
    });
  }, function() {
    callback();
  });
};

function downloadNpmPlugin(model, key, pid, config, cb) {
  var pid = pid.slice(4);

  npm.load({}, function (er) {

    npm.view(pid, function(err, obj) {
      if (err) {
        console.warn('npm 插件 ' + pid + ' 加载失败');
      } 

      var pkg = obj[_.keys(obj)[0]];

      var dir = npm.prefix = path.join(model.globalHome, 'sources', 'npm', pkg.name, pkg.version);
      async.waterfall([function(callback) {
        if (!fsExt.existsSync(dir)) {
          npm.commands.install([pid], function(err, data) {
            if (err) {
              throw new Error('插件 ' + pid + ' 依赖模块下载失败');
            } 

            // 把模块从 node_modules 移出来.
            var temp = path.join(dir, '__temp');
            shelljs.mkdir(temp);
            shelljs.mv('-f', path.join(dir, 'node_modules', pkg.name, '*'), temp);
            shelljs.rm('-r', path.join(dir, 'node_modules'));
            shelljs.mv(path.join(temp, 'dist', '*'), dir);
            shelljs.mv(path.join(temp, 'node_modules'), dir);
            shelljs.mv(path.join(temp, 'package.json'), dir);
            shelljs.rm('-rf', temp);
            //shelljs.mv(path.join(temp, '*'), dir);
            callback(null, dir);
          });
        } else {
          callback(null, dir);
        }
      }, function(dir, callback) {
        // 替换插件代码的模块依赖为相对依赖.
        replacePluginRequire(dir, pkg.dependencies); 
        callback(null, dir); 
      }, function(dir, callback) {
        cacheModule(key, dir, pkg, config);
        callback(null);
      }], function(err, result) {
        cb(); 
      });
    });
    // 把安装的模块安装到 ~/.spm/sources/ 插件的 node_moduels
  });
};

var generatePluginId = (function(rule) {
  return function(obj) {
    return moduleHelp.generateModuleId(rule, obj);
  };
}('{{root}}/{{name}}/{{moduleName}}'));

// 目前标准的 CMD 模块允许一个模块输出多个子模块，插件是不是应该限制只有一个模块。
// 而且模块的名字和项目名称一致?
function loadSubPlugin(key, dir, config, callback) {
  config = config || {};
  var packageJsonPath = path.join(dir, 'package.json');
  var generateModuleId = moduleHelp.generateModuleId;
  var obj;

  if (fsExt.existsSync(packageJsonPath)) {
    obj = JSON.parse(fsExt.readFileSync(packageJsonPath));

    var deps = obj.dependencies;
    
    if (!_.isEmpty(deps) && !fsExt.existsSync(path.join(dir, 'node_modules'))) {

      console.info('开始下载插件' + key + '的 npm 模块依赖....');
      //npm.dir = path.join(path.dirname(npm.dir), './abc')
      // 加载插件依赖的 npm 模块.
      npm.load({}, function (er) {
        if (er) {
          throw new Error('插件 ' + generatePluginId(obj) + ' 依赖模块下载失败');
        } 

        // 把安装的模块安装到 ~/.spm/sources/ 插件的 node_moduels
        npm.prefix = dir;

        var installMods = _.keys(deps).map(function(dep) {
          return dep + '@' + deps[dep];
        });

        npm.commands.install(installMods, function (er, data) {
          if (er) {
            throw new Error('插件 ' + generatePluginId(obj) + ' 依赖模块下载失败');
          } 

          replacePluginRequire(dir, deps); 
          cacheModule(key, dir, obj, config);
          callback();
        });
      })
    } else {
      if (!_.isEmpty(deps)) {
        replacePluginRequire(dir, deps); 
      }
      cacheModule(key, dir, obj, config);
      callback();
    }
  }
}

function replacePluginRequire(dir, deps) {
  // 把插件中的 require 的代码 替换成相对路径.
  var pluginMods = fsExt.list(dir).filter(function(f) {
    return !/^node_modules/.test(f) && /\.js$/.test(f);
  });

  pluginMods.forEach(function(mod) {
    var code = fsExt.readFileSync(dir, mod);
    code = Ast.replaceRequireValue(code, function(value) {
      if (deps[value]) {
        return path.join(dir, 'node_modules', value);
      } else {
        return value; 
      }
    });

    fsExt.writeFileSync(path.join(dir, mod), code);
  });
}

function cacheModule(key, dir, obj, config) {
  _.keys(obj.output).forEach(function(name) {
    if (moduleHelp.isJs(name)) {
      // find plugin
      obj.moduleName = moduleHelp.getBaseModule(name);
      var pluginPath = path.join(dir, name);
      var plugin = loadPlugin(null, pluginPath);
      plugin.config = config;
      PluginCenter[generatePluginId(obj)] = plugin;
      PluginCenter[key + '/' + obj.moduleName] = plugin;
    }
  });
}
