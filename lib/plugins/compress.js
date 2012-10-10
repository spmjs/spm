var async = require('async');
var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

// 提供 tpl 和 css 是否替换处理插件.
// 用户可以通过命令和package.json覆盖默认行为.
var plugin = module.exports = Plugin.create('compress');
plugin.param('compiler', 'uglify', 'use compress tools [closure|uglify]');
plugin.param('compress-options', '', 'set compress options.');

plugin.run = function(project, callback) {
  var argv = this.argv;
  var debug = project.debugName;
  var dist = project.distDirectory;
  var baseDir = project.baseDirectory;
  var sourceFiles = argv['source-files'];
  var sourceDir = dist;

  var compressTool;

  // TODO 当用户输入错误的时候，默认降级为uglify.
  if (this.compiler === 'closure') {
    compressTool = require('../compress/closure');
  } else {
    compressTool = require('../compress/uglify');
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
      var files = fsExt.globFiles(sourceFiles.split(','), dist);
      files.forEach(function(filename) {
        queue.push(filename);
      });
    } else {
      // 指定目录.
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

