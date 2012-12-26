var fs = require('fs');
var path = require('path');
var os = require('os');
var child_process = require('child_process');

exports.safeWrite = function(filepath) {
  if (fs.existsSync(filepath)) return;
  var dirs = [];
  var dirname = path.dirname(filepath);
  while (!fs.existsSync(dirname)) {
    dirs.push(dirname);
    dirname = path.dirname(dirname);
  }
  var mkdir = function(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  };
  dirs.reverse().forEach(mkdir);
};


exports.spawn = function(command, args, options) {
  var spawn = child_process.spawn;
  if (os.type() === 'Windows_NT') {
    spawn = function(command, args, options) {
      args = ['/c', command].concat(args);
      command = 'cmd';
    };
  }
  return spawn(command, args, options);
};
