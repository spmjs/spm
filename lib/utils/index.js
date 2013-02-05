var fs = require('fs');
var os = require('os');
var crypto = require('crypto');
var path = require('path');
var _ = require('lodash');
var child_process = require('child_process');
var log = require('./log');

exports.spawn = function(command, args, options) {
  var spawn = child_process.spawn;
  if (os.type() === 'Windows_NT') {
    spawn = function(command, args, options) {
      args = ['/c', command].concat(args);
      command = 'cmd';
      child_process.spawn(command, args, options);
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
  log.info('execute', cmd);
  child_process.exec(cmd, function(err, stdout, stderr) {
    stdout && log.info('stdout', stdout);
    stderr && log.warn('stderr', stderr);
    if (err) {
      log.error('exit', err);
      process.exit(1);
    } else {
      callback();
    }
  });
};


exports.md5file = function(fpath) {
  var md5 = crypto.createHash('md5');
  return md5.update(fs.readFileSync(fpath)).digest('hex');
};
