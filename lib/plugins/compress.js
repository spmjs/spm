var async = require('async');
var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

// 提供 tpl 和 css 是否替换处理插件.
// 用户可以通过命令和package.json覆盖默认行为.
var plugin = module.exports = Plugin.create('compress');
plugin.param('compiler', 'uglify', 'use compress tools [closure|uglify]');
plugin.param('source-files', null, 'set need to compress file [directory | filelist]');

plugin.run = function(callback) {
  var project = this.project;
  var argv = this.opts.argv;
  var dist = project.distDirectory;
  var baseDir = project.baseDirectory;
  var sourceFiles = this['source-files'];
  var compressTool;

  if (argv.dist) {
    dist = fsExt.perfectLocalPath(argv.dist);
  }

  // TODO 当用户输入错误的时候，被默认降级为uglify.
  if (this.compiler === 'closure') {
    compressTool = require('../compress/closure');
  } else {
    compressTool = require('../compress/uglify');
  }

  var queue = async.queue(function(filepath, callback) {
    compressTool(filepath, function(code) {
      if (argv.dist) {
        filepath = path.join(dist, path.basename(filepath));
      }
      fsExt.writeFileSync(filepath, code);
      callback();
    });
  }, 5);

  queue.drain = function() {
    callback();
  };

  if (sourceFiles) {
    if (path.extname(sourceFiles) === '.js') {
      var files = fsExt.globFiles(sourceFiles.split(','), baseDir);
      files.forEach(function(name) {
        queue.push(path.join(baseDir, name));
      });
    } else {
      // 指定目录.
      findDefaultMinJs(queue, path.join(baseDir, sourceFiles));
    }
  } else {
    findDefaultMinJs(queue, dist);
  }
};

// 找到所有需要压缩的js. 默认规则,查找目录下面的非debug文件.
function findDefaultMinJs(queue, filepath) {
  var that = this;
  if (fsExt.isDirectory(filepath)) {
    fs.readdirSync(filepath).forEach(function(filename) {
      findDefaultMinJs(queue, path.join(filepath, filename));
    });
  } else if (fsExt.isFile(filepath)) {
    if (isMinFile(filepath)) {
      queue.push(filepath);
    }
  }
}

function isMinFile(filepath) {
  return path.extname(filepath) === '.js' && !/-debug\.js$/.test(filepath);
}

