var async = require('async');
var fs = require('fs');
var util = require('util');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');
var PluginConfig = require('../core/plugin_config.js');

var plugin = module.exports = Plugin.create('min');
plugin.param('compressor', 'uglify', 'use compress tools [closure|uglify|yui]');
plugin.param('compress-options', '', 'set compress options.');

plugin.run = function(project, callback) {
  var argv = this.argv;
  var debug = project.debugName;
  var dist = project.distDirectory;
  var baseDir = project.baseDirectory;
  var sourceFiles = project.sourceFiles; 
  var dest = argv.dest;

  // 默认min在build过程中，是对 distDirecotry中代码进行处理.
  var sourceDir = dist;
  var compressTool;

  // 兼容原有参数
  if (argv.compiler && !argv.compressor) {
    this.compressor = argv.compiler;
    console.warn('Please use compressor instead of compiler!');
  }

  // TODO 当用户输入错误的时候，默认降级为uglify.
  if (this.compressor=== 'closure') {
    compressTool = require('../compress/closure');
  } else if (this.compressor === 'yui') {
    compressTool = require('../compress/yui_compress');
  } else {
    compressTool = require('../compress/uglify');
  } 

  if (dest) {
    // 如果发现dest，说明需要把压缩的文件合并，交由concat 插件来处理.
    project.baseDirectory = dist;
    var concatPlugin = PluginConfig.getPlugin('concat');
    concatPlugin.argv = argv;
    var cb = callback;

    callback = function() {
      concatPlugin.run(project, cb);
    }
  }

  var queue = async.queue(function(filename, callback) {
    var filepath = path.join(sourceDir, filename);
    var distpath = path.join(dist, filename);

    compressTool(filepath, function(code) {
      fsExt.writeFileSync(distpath, code);
      callback();
    });
  }, 5);

  queue.drain = function() {
    callback();
  };

  if (sourceFiles) {
    if (argv.dist === '') {
      dist = baseDir;
    }

    if (path.extname(sourceFiles) === '.js') {
      sourceDir = baseDir;

      if (typeof sourceFiles === 'string') {
        sourceFiles = sourceFiles.split(',');
      }

      var files = fsExt.globFiles(sourceFiles, dist);
      files.forEach(function(filename) {
        queue.push(filename);
      });
    } else {
      // 指定目录.
      if (util.isArray(sourceFiles)) {
        sourceFiles = sourceFiles[0]; 
      }

      sourceDir = path.join(baseDir, sourceFiles);
      findDefaultMinJs(queue, sourceDir, debug);
    }
  } else {
    findDefaultMinJs(queue, sourceDir, debug);
  }
};

// 找到所有需要压缩的js. 默认规则,查找目录下面的非debug文件.
function findDefaultMinJs(queue, basepath, debug) {
  fsExt.globFiles('**/*.js', basepath).filter(function(f) {
    return isMinFile(f, debug);
  }).forEach(function(filename) {
      queue.push(filename);  
  });
}

function isMinFile(filepath, debug) {
  var is = path.extname(filepath) === '.js';
  if (!debug || !is) return is; 
  return !new RegExp(debug + '\\.js$').test(filepath); 
}

    
