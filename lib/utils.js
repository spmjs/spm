var fs = require('fs');
var path = require('path');
var os = require('os');
var child_process = require('child_process');
var colorful = require('colorful');

exports.logging = new colorful.Logging();

exports.safeWrite = function(filepath) {
  var root;
  var dirs = path.dirname(filepath).split(path.sep);
  var mkdir = function(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  };
  for (var i = 0; i < dirs.length; i++) {
    if (root) {
      root = path.join(root, dirs[i]);
    } else {
      root = dirs[i];
    }
    mkdir(root);
  }
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
