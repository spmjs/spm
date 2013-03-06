// spm 核心构建模块
// 尝试去加载package.json文件，如果发现package.json则启动标准项目.
// 如果没有package.json则启动项目参数解析插件，去解析对应的参数和目录内容
// 构成非标准项目对象。

'use strict';

var util = require('util');
var path = require('path');
var async = require('async');
var _ = require('underscore');
var colors = require('colors');

var ActionFactory = require('../core/action_factory.js');
var Action = require('../core/action.js');
var PluginConfig = require('../core/plugin_config.js');
var help = require('../utils/module_help.js');
var Commander = require('../utils/commander.js');

var perfectLocalPath = help.perfectLocalPath;

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var Build = ActionFactory.create('Build');
var DEBUG = 'debug';

function parseOutput(val) {
  return eval('({' + val + '})');
}

function parseBoolean(val) {
  if (!val) return false;
  if (val === 'false') return false;
  return true;
}

/**
 * 参数注册.
 */
Build.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('编译 cmd 模块.');
  opts.option('--only [boolean] ', '仅执行当前指定阶段的插件.');
  opts.option('--global-config [global-config]', '加载全局配置, 支持 seajs.config');
  opts.option('--root [str]', '模块的 root [gallery]');
  opts.option('--base [base]', '模块的执行目录, 默认当前目录');
  opts.option('--src [dir]', '模块源码目录, 默认 src');
  opts.option('--name [str]', '模块的名称');
  opts.option('--source [url]', '指定源服务地址. [modules.spmjs.org]');
  opts.option('--to [dir]', '指定模块输出目录.');
  opts.option('--ver [version]', '设置模块的版本');
  opts.option('--output [output config]', '模块合并规则.', parseOutput);
  opts.option('--source-files [dir]', '设置需要处理的目录.');
  opts.option('--throwErrorOnDepNotFound [true or false]',
          '当依赖找不到的时候，是否终止执行, 默认是 false');
  opts.option('--with-debug [debugName]', 'debug 模块的标志, 默认 debug');
  
  opts.option('--build-config [string]', '指定 package.json 的位置');

  // TODO 暂时没有想好如何更好的传递 data 数据
  //opts.option('--filter', '是否开启变量过滤, 默认关闭', parseBoolean, false);
  
  opts.option('--compressor [compressorType]', '指定压缩工具,默认 uglify [closure|uglify|yui]');
  opts.option('--compress-options [p1,p2,p3]', '设置压缩参数, 仅针对 yui 和 uglifyjs');
  opts.option('--skip-min [boolean]', '跳过压缩');

  opts.option('--convert-style [string]', '对模块依赖的 css 模块进行转换, 默认 inline [none | inline | js]');

  opts.option('--tpl [boolean]', '是否内嵌模板, 目前支持 tpl, htm , html 三种形式的模板. 默认内嵌模板', parseBoolean);
  
  opts.option('--convert-json [boolean]', '是否对依赖的 json 模块内嵌. 默认是内嵌', parseBoolean);

  opts.option('--no-less', '是否关闭 less 编译.');

  opts.option('--lint', '是否开启 jshint 或者 csslint 检查.', parseBoolean);
  opts.option('--zip', '是否生成 zip 包.', parseBoolean);

  opts.on('--help', function() {
    console.info();
    console.info('  ' + 'Examples:'.bold.blue);
    console.info();
    console.info('   ' + opts.description());
    console.info();
    console.info('   $ ' + 'spm build'.magenta);
    console.info();
    console.info('   build 到指定目录');
    console.info();
    console.info('   $ ' + 'spm build'.magenta + ' ' + '--to='.cyan + './dist2');
    console.info();
    console.info('   指定其他压缩工具, 并配置压缩的参数');
    console.info();
    console.info('   $ ' + 'spm build'.magenta + ' ' + '--compressor='.cyan + 'yui' + ' --compress-options='.cyan + 'v,nomunge');
    console.info();
    console.info('   build 的时候禁止压缩');
    console.info();
    console.info('   build 的时候显示日志信息，帮助错误调试');
    console.info();

    console.info('   $ ' + 'spm build'.magenta + ' ' + '-v'.cyan);
    
    console.info('   查看更多信息: ' + 'https://github.com/spmjs/spm/wiki'.underline);
    console.info();
  });
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
      projectModel.action = action;

      if (isBuildProject(action, projectModel) && !projectModel.root) {
        throw new Error('package.json 缺少必要的配置信息 root!');
      }

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
          console.info(action.toUpperCase() + ' ' + projectModel.name.toUpperCase() +  ' SUCCESS!');
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
    case 'sourceFiles':
      if (options.args && options.args.length > 1) {
        // 主要防止下面这两种情况:
        // spm build src/*.js
        // spm lint src/**/*.js
        // node会自动把通配符进行展开.
        value = value || options.args;
      }

      if (_.isString(value) && value.indexOf(',') > -1) {
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
           delete value[key];
         }
       });
       return value;

    case 'withDebug':
      if (value === '' || value === 'false' || value === false) {
        value = '';
      }

      if (value === true || value === 'true') {
        value = DEBUG;
      }

      return value;

    case 'base':
    case 'build':
      return perfectLocalPath(value);
  }
  return value;
}

function isBuildProject(action, project) {
  var actions = PluginConfig.LifeCycle.map(function(obj) {
    return Object.keys(obj)[0];
  });

  return actions.indexOf(action) > -1 && project.name !== 'seajs';
}

Build.prototype._execute = function(projectModel, callback) {
  this.runPlugins(projectModel, callback);
};

module.exports = Build;

// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表
