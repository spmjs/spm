var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var _ = require('lodash');
var child_process = require('child_process');
var log = require('./log');


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


exports.childexec = function (cmd, options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = null;
  }
  log.info('execute', cmd);
  child_process.exec(cmd, options, function(err, stdout, stderr) {
    if (err) {
      callback(err);
    } else if (stderr) {
      callback(stderr);
    } else {
      callback(err, stdout);
    }
  });
};


exports.md5file = function(fpath) {
  var md5 = crypto.createHash('md5');
  return md5.update(fs.readFileSync(fpath)).digest('hex');
};
