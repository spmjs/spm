var _ = require('lodash');
var child_process = require('child_process');

var git = module.exports = {};

git.revision = function(options, callback) {
  exec('rev-parse HEAD', options, callback);
};

git.checkout = function(rev, options, callback) {
  exec('checkout ' + rev, options, callback);
};


function exec(cmd, options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = null;
  }
  child_process.exec('git ' + cmd, options, function(err, stdout, stderr) {
    if (stderr) {
      callback(stderr);
    } else {
      callback(err, stdout);
    }
  });
}
