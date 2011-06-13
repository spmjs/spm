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

exports.spm = function() {
  console.log('');
  exports.welcome();
  console.info('ACTIONS' + console.colorize(
      ' - run "spm help" for showing this help again.', 'log'));
  console.log('=======================================================');
  console.log('Usage: spm [action] [action-options] [module] [module] ..');
  console.log('');
  console.warn('build/transport:');
  console.info('  Transport module code to seajs modules.');
  console.log('    $ spm build jquery');
  console.info('');
  console.warn('rm/remove:');
  console.info('  remove module from seajs modules.');
  console.log('    $ spm remove jquery');
  console.info('');
  console.info('KEEP IN TOUCH' + console.colorize(' - Visit ', 'log') +
      console.colorize('https://github.com/seajs/spm', 'warn') +
      ' for more details');
  console.log('=======================================================');
  console.log('Any Recommendations, please feel free to contact ' +
      console.colorize('@lifesinger', 'warn') +
      ' or ' + console.colorize('@yyfrankyy', 'warn') + ' on twitter.');
  console.log('');
};

exports.welcome = function() {
  console.info('Welcome to SPM' + console.colorize(
      ' - A Package Manager for SeaJS', 'log'));
  console.log('=======================================================');
  console.warn('');
  console.warn('       .d8888b.                 888888  .d8888b.  ');
  console.warn('      d88P  Y88b                  "88b d88P  Y88b ');
  console.warn('      Y88b.                        888 Y88b.      ');
  console.warn('       "Y888b.    .d88b.   8888b.  888  "Y888b.   ');
  console.warn('          "Y88b. d8P  Y8b     "88b 888     "Y88b. ');
  console.warn('            "888 88888888 .d888888 888       "888 ');
  console.warn('      Y88b  d88P Y8b.     888  888 88P Y88b  d88P ');
  console.warn('       "Y8888P"   "Y8888  "Y888888 888  "Y8888P"  ');
  console.warn('                                 .d88P            ');
  console.warn('                               .d88P"             ');
  console.warn('                              888P"               ');
  console.warn('');
};
