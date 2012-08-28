
// 1. 配置文件读取.
// 2. 参数分析
// 3. 构建项目模型
var util = require('util');
var fs = require('fs');
var path = require('path');
var Opts = require('../utils/opts.js');
var fsExt = require('../utils/fs_ext.js');
var Action = require('./action.js');
var Lifecycle = require('./lifecycle.js');
var PluginFactory = require('./plugin_factory.js'); 

var ActionFactory = exports;

ActionFactory.create = function(action) {
  action = action.toLowerCase();
  return new Action(action, Opts.get(action));
};

ActionFactory.get = function(action, fn) {
 
  // 1. 去actions里面查找.
  var actionDir = path.join(path.dirname(module.filename), '../actions');

  var defaultActions = fs.readdirSync(actionDir).filter(function(name) {
    return !!path.extname(name) && path.extname(name) === '.js';
  }).map(function(name) {
    return name.slice(0, name.lastIndexOf('.js'));
  });

  if (defaultActions.indexOf(action) > -1) {
    var actionObj = require(path.join(actionDir, action));
    fn(null, actionObj);
  }
  // 2. 去lifecycle里面查找.

  // 3. 从plugins里面去查找.
};
