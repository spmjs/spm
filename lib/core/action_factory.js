
// 1. 配置文件读取.
// 2. 参数分析
// 3. 构建项目模型
var util = require('util');
var fs = require('fs');
var path = require('path');
var Opts = require('../utils/opts.js');
var fsExt = require('../utils/fs_ext.js');
var Action = require('./action.js');
var PluginConfig = require('./plugin_config.js');
var PluginFactory = require('./plugin_factory.js'); 

var ActionFactory = exports;

ActionFactory.create = function(action, parent) {
  var ParentAction = Action;
  if (parent) {
    ParentAction = exports.getAction(parent);
  }

  function SubAction() {
    ParentAction.apply(this, arguments);
  }

  util.inherits(SubAction, ParentAction);

  SubAction.name_ = action.toLowerCase();
  return SubAction;
};

ActionFactory.getDefaultActionList = function() {
  var actionDir = path.join(path.dirname(module.filename), '../actions');
  return fs.readdirSync(actionDir).filter(function(name) {
    return !!path.extname(name) && path.extname(name) === '.js';
  }).map(function(name) {
    return name.slice(0, name.lastIndexOf('.js'));
  });
};

ActionFactory.getAction = function(action) {
  var Cons;

  // 1. 去actions里面查找.
  var actionDir = path.join(path.dirname(module.filename), '../actions');

  var defaultActions = fs.readdirSync(actionDir).filter(function(name) {
    return !!path.extname(name) && path.extname(name) === '.js';
  }).map(function(name) {
    return name.slice(0, name.lastIndexOf('.js'));
  });

  if (defaultActions.indexOf(action) > -1) {
    Cons = require(path.join(actionDir, action));
  } else if (PluginConfig.getPlugins(action).length > 0) {
    
    // 2. 去lifecycle里面查找. 默认都是build的子类.
    Cons = ActionFactory.create(action, 'build');
  } else {
    // 3. 从plugins里面去查找.
    // TODO 需要从plugins中检查是否需要项目模型.
    var plugins = PluginFactory.getPlugins(action);
    if (plugins.length > 0) {
      Cons = ActionFactory.create(action, 'build');
    } else {
      Cons = exports.getAction('help');
    }
  } 
  return Cons;
};

ActionFactory.getActionObj = function(action) {
  var Cons = exports.getAction(action);
  return new Cons(Cons.name_);
};
