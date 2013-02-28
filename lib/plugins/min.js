'use strict';

var async = require('async');
var fs = require('fs');
var util = require('util');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var Plugin = require('../core/plugin.js');
var PluginConfig = require('../core/plugin_config.js');

var plugin = module.exports = Plugin.create('min');

plugin.run = function(project, callback) {
  if (project.getConfig('skipMin')) {
    console.info('skip min file!');
    callback();
    return;
  }

  var argv = this.argv;
  var debug = project.debugName;
  var dist = project.distDirectory;
  var baseDir = project.baseDirectory;
  var sourceFiles = project.getConfig('sourceFiles');
  var dest = argv.dest;

  // 默认min在build过程中，是对 distDirecotry中代码进行处理.
  var sourceDir = dist;
  var jsCompressTool = require('../compress/uglify');
  var cssCompressTool = require('../compress/clean_css');

  // 兼容原有参数
  if (argv.compiler && !argv.compressor) {
    this.compressor = argv.compiler;
    console.warn('Please use compressor instead of compiler!');
  }

  var compressor = project.getConfig('compressor');

  // TODO 当用户输入错误的时候，默认降级为uglify.
  if (compressor === 'closure') {
    jsCompressTool = require('../compress/closure');
  } else if (compressor === 'yui') {
    jsCompressTool = require('../compress/yui_compress');
  }

  if (dest) {
    // 如果发现dest，说明需要把压缩的文件合并，交由concat 插件来处理.
    project.baseDirectory = dist;
    var concatPlugin = PluginConfig.getPlugin('concat');
    concatPlugin.argv = argv;
    var cb = callback;

    callback = function() {
      concatPlugin.run(project, cb);
    };
  }

  // 压缩指定模块到 dist 目录。
  var queue = async.queue(function(filename, callback) {
    var filepath = path.join(sourceDir, filename);
    var distpath = path.join(dist, filename);
    var tools = function() {
      callback();
    };

    if (moduleHelp.isJs(filename)) {
      tools = jsCompressTool;
    }

    if (moduleHelp.isCss(filename)) {
      tools = cssCompressTool;
    }

    tools(filepath, function(code) {
      fsExt.writeFileSync(distpath, code);
      callback();
    }, project);
  }, 5);

  queue.drain = function() {
    callback();
  };

  // 如果用户设置 sourceFiles, 则会优先处理。
  if (sourceFiles && sourceFiles.length) {
    if (sourceFiles.length === 1) {
      sourceFiles = sourceFiles.pop();
    }

    if (typeof sourceFiles === 'string') {
      if (fsExt.isDirectory(path.join(baseDir, sourceFiles))) {
        sourceDir = path.join(baseDir, sourceFiles);
        findDefaultMinJs(queue, sourceDir, debug);
      } else {
        queue.push(sourceFiles);
      }
    } else {
      sourceDir = baseDir;
      // 处理数组，不支持数组中，又有目录，还有文件。
      sourceFiles.forEach(function(filename) {
        queue.push(filename);
      });
    }
  } else {
    findDefaultMinFile(queue, sourceDir, 'js', debug);
    findDefaultMinFile(queue, sourceDir, 'css', debug);
  }
};

// 找到所有需要压缩的js. 默认规则,查找目录下面的非debug文件.
function findDefaultMinFile(queue, basepath, type, debug) {
  fsExt.globFiles('**/*.' + type, basepath).filter(function(f) {
    return isMinFile(f, type, debug);
  }).forEach(function(filename) {
      queue.push(filename);
  });
}

function isMinFile(filepath, type, debug) {
  var is = path.extname(filepath) === '.' + type;
  if (!debug || !is) return is;
  return !new RegExp(debug + '\\.' + type + '$').test(filepath);
}
