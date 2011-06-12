// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview help message for spm.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var console = require('./log');

exports.gzip = function() {
  console.warn('gzip is not supported');
  console.info('build \'node-compress\' first:');
  console.info('');
  console.info('    git submodule update support/node-compress');
  console.info('    cd support/node-compress');
  console.info('    node-waf configure && node-waf build');
  console.info('');
};

exports.version = function(version) {
  console.warn('%s is not a valid publish version', version);
  console.warn('we use http://semver.org/ for validating version number');
  console.warn('you can use force mode to force build this unstable version');
};

exports.moduleExists = function(src, name) {
  console.warn('%s already exists, ignore', src);
  console.warn('update version information in your %s.tspt', name);
  console.warn('or use force mode to update');
};
