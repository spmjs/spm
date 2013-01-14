'use strict';

// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。

var path = require('path');
var async = require('async');
var CleanCSS= require('clean-css');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var cleanCss = require('../compress/clean_css.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;
var isJs = moduleHelp.isJs;
var isCss = moduleHelp.isCss;

var Plugin = require('../core/plugin.js');

var outputPlugin = module.exports = Plugin.create('output');

// 项目文件合并输出.
outputPlugin.run = function(project, callback) {

  // 如果单独执行，那么默认用户的源码目录作为处理目录.
  if (this.opts.rawArgs[2] === 'output') {
    fsExt.copydirSync(project.srcDirectory, project.buildDirectory);
  }

  extend_output(project, this.opts);
  var output = project.output;

  // 如果没有配置output, 默认把build目录copy到dist目录.
  if (!output || Object.keys(output).length === 0) {
    fsExt.copydirSync(project.buildDirectory, project.distDirectory);
    callback();
    return;
  }

  var handler = new RuleHandler(project, output);

  // TODO 动态加载规则处理列表.
  handler.add(require('./output/compositeMergeRule.js'));
  handler.add(require('./output/jsMergeRule.js'));
  handler.add(require('./output/cssMergeRule.js'));
  handler.add(require('./output/resourcesRule.js'));
  handler.add(require('./output/resourceDirRule.js'));

  async.series([
    function(callback) {

      // 对includes进行整理.
      handler.perfectIncludes(callback);
    },

    function(callback) {

      //log('begin merge file :', output);
      // 开始输出，输出的时候需要进行过滤。
      // 首先需要把合并的模块规整成一个id数组。
      // 然后在includes里面每合并一项，就检查是否存在，如果存在就需要把他已经合并的文件从includes中删除。
      handler.merge(callback);
    }
   ], function() {
    callback();
  });
};


// 解析比较复杂的output规则
function extend_output(project, argv) {
  var handlersDir = path.join(path.dirname(module.filename), 'output_extra');

  var outputHandlers = fsExt.listFiles(handlersDir).map(function(mod) {
    return require(mod);
  });

  outputHandlers.forEach(function(handler) {
    handler.run(project, argv);
  });
}

var RuleHandler = function(project, output) {
  this.project = project;
  this.output = output;
  this._rules = [];
  this.globalExcludes = project.reservedDeps || [];
  this.collectOutputExcludes();
  this.normalizeOutputKeys();
};

RuleHandler.prototype.add = function(rule) {
  this._rules.push(rule);
};

RuleHandler.prototype.collectOutputExcludes = function() {
  var project = this.project;
  var output = project.output;
  var that = this;
  Object.keys(output).forEach(function(o) {
    if (o === '*') {
      // find global excludes.
      var excludes = output[o].excludes;
      if (typeof excludes === 'string') {
        excludes = [excludes];
      }

      excludes = moduleHelp.globMods(excludes, project.buildDirectory);

      if (excludes && excludes.length) {
        excludes.forEach(function(exclude) {
          if (that.globalExcludes.indexOf(exclude) < 0) {
            that.globalExcludes.push(exclude);
          }
        });
      }
      delete output['*'];
    }
  });
};

// 支持output的key简化. fix https://github.com/seajs/spm/issues/292
RuleHandler.prototype.normalizeOutputKeys = function() {
  var project = this.project;
  var build = project.buildDirectory;
  var output = project.output;
  var type = project.type;
  var that = this;
  Object.keys(output).forEach(function(o) {
    if (/\/$/.test(o)) {
      return;
    }

    var ext = path.extname(o);
    // a or ./a ==> ./a.js
    if (ext || (ext === '' &&
        fsExt.existsSync(path.join(build, o + '.' + type)))) {

      var includes = output[o];
      delete output[o];

      if (ext && o.indexOf('.' !== 0)) {
        o = './' + o;
      }

      output[normalize(o, ext || type)] = includes;
    }
  });
};

RuleHandler.prototype.loop = function(handler, callback) {
  var that = this;
  var output = this.output;

  // 迭代遍历所有的输出项，找到合适的规则处理器，然后规整Inclues的内容.
  async.forEachSeries(Object.keys(output), function(filename, callback) {
  if (!filename) callback();
    var includes = output[filename];

    that.find(filename, includes, function(rule) {
      if (!rule) {

        // 如果没有找到规则，抛出错误.
        throw new Error('[spm ouput plugin] output parse error!(' + filename + ': ' + includes + ')');
      }

      handler(rule, filename, includes, callback);
    });
  }, function() {
    callback && callback();
  });
};

// 遍历所有的output,然后对用户配置的mergeRule 进行解析:
// 1. 对于内部模块，返回模块路径即可。
// 2. 对于全局模块，返回仓库的文件地址。(TODO debug看看怎么处理)
RuleHandler.prototype.perfectIncludes = function(callback) {
  var output = this.output;
  var that = this;

  var handler = function(rule, filename, includes, callback) {
     rule.getIncludes(that, filename, includes, function(includes) {
      output[filename] = includes;
      callback();
    });
  };

  this.loop(handler, callback);
};

// 合并文件并输出.
// 由于我们需要对合并的文件进行依赖替换，所以我们可以进行缓存。
RuleHandler.prototype.merge = function(callback) {
  var that = this;

  var handler = function(rule, filename, includes, callback) {
    rule.output(that, filename, includes, callback);
  };

  this.loop(handler, callback);
};

RuleHandler.prototype.hasOutput = function(moduleName) {
  moduleName = normalize(moduleName);
  var includes = this.output[moduleName];

  // 如果只包含自己一个模块，那么忽略.
  return includes && includes.length > 1;
};

// 根据ouput的每一个输出规则找到合适的处理器进行处理.
RuleHandler.prototype.find = function(filename, includes, callback) {
  async.detectSeries(this._rules, function(rule, callback) {
    callback(rule.check(filename, includes));
  }, callback);
};

// 目前下面几个需求
// 1. 规则的执行需要同步，因为牵扯到合并，可能需要从服务器获取模块
// 2. 规则可态的从文件中获取.
// 3. 规则需要提供一个方法来检查includes，来确定是否有次规则来执行.
// 4. 系统会给规则提供project, includes, outputFilename, callback信息.
// 5. Rule可以是一个函数.
