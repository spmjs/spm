// spm 核心模块
// TODO 尝试去加载package.json文件，如果发现package.json则启动标准项目.
//      如果没有package.json则启动项目参数解析插件，去解析对应的参数和目录内容
//      构成非标准项目对象。

var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');

var ActionFactory = require('../core/action_factory.js');
var Action = require('../core/action.js');
var PluginConfig = require('../core/plugin_config.js');
var help = require('../utils/module_help.js');

var perfectLocalPath = help.perfectLocalPath;

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var Build = ActionFactory.create('Build');
var DEBUG = 'debug';

/**
 * 参数注册.
 */
Build.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('BUILD CMD MODULE');
  opts.add('only', 'only execute current phrase plugin.');
  opts.add('global-config', 'use user custom config.');
  opts.add('base', 'set base directory.');
  opts.add('src', 'set src directory.');
  opts.add('dist', 'set dist directory.');
  opts.add('source', 'set source server.');
  opts.add('version', 'set module version.');
  opts.add('source-files', 'set directory which need to compile.');
  opts.add('throwErrorOnDepNotFound',
          'throw error when dependencies not found.');
  opts.add('with-debug', 'add debug file.');

  opts.defaultValue('throwErrorOnDepNotFound', false);
  opts.defaultValue('source-files', null);
  opts.defaultValue('with-debug', 'debug');
  opts.defaultValue('base', process.cwd());
  opts.type('throwErrorOnDepNotFound', 'boolean');
  opts.type('base', 'string');
  opts.type('src', 'string');
  opts.type('dist', 'string');
  opts.type('version', 'string');
  opts.type('with-debug', 'string');
};

Build.prototype.execute = function(opts, callback) {
  var that = this;
  var action = this.name;

  var options = this.createOptions(opts, parse);

  // build is proxy action.
  console.info('Scanning for projects...');

  // 根据当前执行目录，查找配置文件，构建项目信息。
  var projectModel = ProjectFactory.getProjectModel(action, options,
    function(projectModel) {

      console.info('');
      console.segm();
      console.info('Building ' + projectModel.name + ' ' + projectModel.version);
      console.segm();

      that._execute(projectModel, function(err) {
        if (err) {
          console.segm();
          console.error(action.toUpperCase() + ' ERROR!');
          console.segm();
          process.exit(1);
        } else {
          console.segm();
          console.info(action.toUpperCase() + ' SUCCESS!');
          console.segm();
        }
        callback && callback(projectModel);
      }
    );
  });
};

function parse(key, value, options) {

  switch (key) {
    // 默认action 后面用户指定的内容为source-files
    // 也就是需要操作的内容,可以是目录也可以是文件.
    // 具体的插件根据相应的内容进行处理.
    case 'source-files':
      if (options._ && options._.length > 3) {
        // 主要防止下面这两种情况:
        // spm build src/*.js
        // spm lint src/**/*.js
        // node会自动把通配符进行展开.
        value = value || options._.slice(3);
      }

      if (typeof value === 'string' && value.indexOf(',') > -1) {
        // 解析source-files,目录计算出绝对路径, 文件拆分成对应的数组.
        value = value.split(',');
      }

      return value;

    case 'output':
       // 由于optimist的原因，添加.js会有问题.
       Object.keys(value).forEach(function(key) {
         var v = value[key];

         // 特殊值的合并规则.
         if (v !== '.' && v !== '*' && v !== 'default') {
           v = v.split(',');
         }

         if (key === '*') {
           value[key] = v;
         } else {
           value[key + '.js'] = v;
         }
       });
       return value;

    case 'with-debug':
      if (value === '' || value === 'false' || value === false) {
        value = '';
      }

      if (value === true || value === 'true') {
        value = DEBUG;
      }

      return value;

    case 'base':
    case 'to':
    case 'dist':
    case 'build':
      return perfectLocalPath(value);
  }
  return value;
}

Build.prototype._execute = function(projectModel, callback) {
  this.runPlugins(projectModel, callback);
};

module.exports = Build;

// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表
