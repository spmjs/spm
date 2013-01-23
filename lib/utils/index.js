var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var child_process = require('child_process');
var logging = require('colorful').logging;

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


exports.require = function(item) {
  if (!_.isString(item)) return item;
  var basename = path.basename(item);
  var bits = basename.split('.');
  var directory = path.dirname(item);
  if (directory.charAt(0) === '.') {
    directory = path.join(process.cwd(), directory);
  }
  var module = require(path.join(directory, _.first(bits)));
  bits = bits.slice(1);
  if (!_.isEmpty(bits)) {
    bits.forEach(function(bit) {
      module = module[bit];
    });
  }
  return module;
};


exports.childexec = function(cmd, callback) {
  logging.info(cmd);
  child_process.exec(cmd, function(err, stdout, stderr) {
    logging.info(stdout);
    logging.warn(stderr);
    if (err) {
      logging.error(err);
      process.exit(1);
    } else {
      callback();
    }
  });
};
