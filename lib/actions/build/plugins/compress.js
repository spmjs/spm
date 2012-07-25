var async = require('async');
var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;

var uglifyjs = require('../compress/uglify');
var fsExt = require('../../../utils/fs_ext.js');

// 提供 tpl 和 css 是否替换处理插件.
// 用户可以通过命令和package.json覆盖默认行为.
var argv = require('optimist').
    usage('Usage: $0 -c[use google Closure Compiler]')[
    'default']('c', false).
    argv;

module.exports = function(project, callback) {
  var compress;
  if (argv.c) {
    compress = require('../compress/closure');
  } else {
    compress = uglifyjs;
  }

  var queue = async.queue(function(filepath, callback) {
    compress(filepath, function(code) {
      fsExt.writeFileSync(filepath, code);
      callback();
    });
  }, 5);

  queue.drain = function() {
    console.log('');
    console.log(' The plugin compress completed successfully!');
    console.log('');
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

