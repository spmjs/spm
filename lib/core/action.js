// 1. 一个Action就是一个基本任务执行单元，每一个Action都是独立的.
// 2. 一个Action可以挂载多个插件。
// 3. Action 本身也可以是抽象的，只是作为插件的facade. 我们可以封装一个类似的PluginAction。
//    作为默认插件的Action. 这样用户也可以手动的传入插件执行列表，我们会把这些插件构造成一个
//    可执行单元，比如: spm plugin clean.js output.js dependencies.js
// 4. 可以存在一个没有pluign 的 Action实例，具体的任务由action本身来完成.(init, server..)
// 5. 一个Action存在插件，那么具体的任务应该由插件来完成，Action 只是负责给插件提供一个Model.
//    这个Model提供了插件需要的信息，具体来说，插件执行需要的东西都只能从Model,
//    或者model提供的内容间接获取.
//    其中插件可以给这个Model注册数据，但是这个需要用户很清楚自己的行为.
// 6. 只有在actions目录中的才会给出help信息。
// 7. 在spm负责根据用户的参数确定加载那个action, 其中HelpAction会负责加载所有的Action,并收集出
//    整个帮助信息。打印出来，当用户输入了一个无法加载的Action的时候，也会转调用HelpAction.
// 8. SPM启动的时候，只会加载~/.spm/config.json. 不会去加载当前目录的配置。用户可以提供参数决定是否
//    加载当前配置
// 9. 参数解析，配置加载进行统一，在SPM启动后会把这些构建成一个统一的数据对象模型。
// 10. Opts在不同的Action有自己的独立的变量。

'use strict';

var util = require('util');
var async = require('async');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var PluginConfig = require('./plugin_config.js');
var Commander = require('../utils/commander.js');

function Action(name, parentName) {
  this.name = name;
  this.modules = [];
  this.opts = Commander.get(name, parentName);
  this.argv = this.opts;
  this.plugins = [];
  this.initArgs();
}

util.inherits(Action, EventEmitter);

Action.prototype.run = function(options, callback) {
  var opts = this.opts;

  if (arguments.length === 1) {
    callback = options;
    options = opts;
  } else {
    options = _.defaults(options, opts);
  }

  // spm install jquery widget
  options.extras = opts.args.slice(1);

  if (this.execute) {
    this.execute(options, callback);
  } else {
    this.runPlugins({}, callback);
  }
};

Action.prototype.initPlugins = function(model) {
  var opts = this.opts;
  this.plugins = PluginConfig.getPlugins(this.name, model.type, opts.only, model.getConfig('plugins')).
      map(function(plugin) {
            plugin.setOpts(opts);
            return plugin;
      });
};

// 需要提供数据模型
// load config plugins
Action.prototype.runPlugins = function(model, callback) {
  // 自己去插件中心查找，自己的插件.
  this.initPlugins(model);

  if (this.plugins.length === 0) {
    callback();
    return;
  }

  // add clean plugin
  this.plugins.push(PluginConfig.getPlugin('clean'));

  var skip = model.getConfig('skip');

  if (skip) {
    if (_.isString(skip)) {
      skip = skip.split(',');
    };

    if (!_.isArray(skip)) {
      skip = [];
    }

    this.plugins = this.plugins.filter(function(plugin) {
      return skip.indexOf(plugin.name) < 0;
    });
  }

  async.mapSeries(this.plugins, function(plugin, callback) {
    callback(null, function(callback) {
      plugin.execute(model, callback);
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

Action.prototype.initArgs = function() {
  this.registerArgs();
  this.plugins.forEach(function(p) {
    p.registerArgs();
  });
  this.opts.parse(process.argv);
};

Action.prototype.registerArgs = emptyFn;

Action.prototype.help = function(verbose) {
  return Commander.get(this.name).help();
};

function emptyFn() {

}

Action.prototype.createOptions = function(options, parse) {
  return {

    getConfig: function(name) {
      var value = options[name];

      if (typeof value === 'undefined') {
        return value;
      }

      if (parse) {
        return parse(name, value, options);
      }
      return value;
    },

    parse: parse
  };
};

module.exports = Action;
