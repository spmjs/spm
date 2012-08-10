var async = require('async');
var fs = require('fs');
var path = require('path');

var fsExt = require('../../../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

// 提供 tpl 和 css 是否替换处理插件.
// 用户可以通过命令和package.json覆盖默认行为.
var plugin = module.exports = Plugin.create('compress');
plugin.param('compiler', "uglify");

plugin.run = function(callback) {
  var project = this.project;
  var compress;

  // TODO 当用户输入错误的时候，被默认降级为uglify.
  if (this.compiler === 'closure') {
    compress = require('../compress/closure');
  } else {
    compress = require('../compress/uglify');
  }

  var queue = async.queue(function(filepath, callback) {
    compress(filepath, function(code) {
      fsExt.writeFileSync(filepath, code);
      callback();
    });
  }, 5);

  queue.drain = function() {
    callback();
  };

  findMinJs(queue, project.distDirectory);
};

// 找到所有需要压缩的js
function findMinJs(queue, filepath) {
  var that = this;
  if (fsExt.isDirectory(filepath)) {
    fs.readdirSync(filepath).forEach(function(filename) {
      findMinJs(queue, path.join(filepath, filename));
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

