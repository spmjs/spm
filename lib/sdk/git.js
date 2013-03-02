var _ = require('lodash');
var exec = require('../utils').childexec;

var git = module.exports = {};

git.revision = function(options, callback) {
  exec('git rev-parse HEAD', options, callback);
};

git.checkout = function(rev, options, callback) {
  exec('git checkout ' + rev, options, callback);
};

git.clone = function(url, dest, options, callback) {
  exec('git clone ' + url + ' ' + dest, options, callback);
};

git.pull = function(options, callback) {
  exec('git pull', options, callback);
};
