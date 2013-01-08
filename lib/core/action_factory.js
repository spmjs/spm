// 1. 配置文件读取.
// 2. 参数分析
// 3. 构建项目模型
var util = require('util');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var fsExt = require('../utils/fs_ext.js');
var Action = require('./action.js');
var PluginConfig = require('./plugin_config.js');
var Commander = require('../utils/commander.js');

var ActionFactory = exports;

var ActionCache = {

};

var ActionObjCache = {

};

ActionFactory.create = function(action, parentName) {
  var ParentAction = Action;
  if (parentName) {
    ParentAction = exports.getAction(parentName, parentName);
  }

  function SubAction() {
    ParentAction.apply(this, arguments);
  }

  util.inherits(SubAction, ParentAction);

  SubAction.name_ = action.toLowerCase();
  SubAction.parent_ = parentName || null;
  ActionCache[action] = SubAction;
  return SubAction;
};

ActionFactory.getDefaultActionList = function() {
  var actionDir = path.join(path.dirname(module.filename), '../actions');
  var actionList = fs.readdirSync(actionDir).filter(function(name) {
    return !!path.extname(name) && path.extname(name) === '.js';
  }).map(function(name) {
    return name.slice(0, name.lastIndexOf('.js'));
  });

  //TODO 由于 Action 里面也存在依赖关系，看看是否能动态的去判断这些顺序，目前先硬编码
  actionList.unshift('build');
  actionList = _.uniq(actionList);

  return actionList;
};

ActionFactory.initAllAction = function() {
  ActionFactory.getDefaultActionList().forEach(function(action) {
    ActionFactory.getActionObj(action);
  });
}

ActionFactory.getAction = function(action, parentName) {
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
    // 3. 从plugins里面去查找.
    Cons = ActionFactory.create(action, 'build');
  } else {
    Cons = exports.getAction('help');
  }

  return Cons;
};

ActionFactory.getActionObj = function(action) {
  if (ActionObjCache[action]) {
    return ActionObjCache[action];
  }

  var Cons = ActionCache[action] || (ActionCache[action] = exports.getAction(action));
  
  return ActionObjCache[action] = new Cons(Cons.name_, Cons.parent_);
};
