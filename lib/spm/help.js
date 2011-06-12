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
