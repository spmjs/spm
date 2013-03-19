var _ = require('lodash');
var exec = require('../utils').childexec;

var git = module.exports = {};

git.revision = function(options, callback) {
  exec('git rev-parse HEAD', options, callback);
};

git.checkout = function(rev, options, callback) {
  exec('git checkout -q ' + rev, options, callback);
};

git.clone = function(url, dest, options, callback) {
  exec('git clone ' + url + ' ' + dest, options, callback);
};

git.pull = function(options, callback) {
  exec('git pull', options, callback);
};

git.remote = function(options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = null;
  }

  exec('git remote -v', options, function(err, stdout) {
    if (err) {
      callback(err);
      return;
    }
    var re = /^origin\s/;
    var lines = stdout.split('\n').filter(re.test, re);
    if (lines.length > 0) {
      callback(null, lines[0].split(/\s/)[1]);
    } else {
      callback('no remote');
    }
  });
};
