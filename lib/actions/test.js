// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm test.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var factory = require('../lib/actionFactory'),
    message = require('../i18n/message'),
    fs = require('fs'),
    path = require('path');

var Test = factory.create();

Test.prototype.run = function(opts) {
  var dirs = fs.readdirSync(path.join(__dirname, '../../../test/spm'));
  var args = opts.mods;
  var tests = args.length > 0 ? args : dirs;
  tests.forEach(function(mod) {
    try {
      process.stdout.write('running specs on ' + mod.yellow + '..');
      require(path.join('../../../test/spm', mod, 'test')).run();
      process.stdout.write('\b\b, ' + 'Passed'.green + '.\n');
    } catch (e) {
      process.stdout.write('\b\b, ' + 'Failed'.red + '.\n');
      throw e;
    }
  });
};


Test.prototype.__defineGetter__('completion', function() {
  var dirs = fs.readdirSync(path.join(__dirname, '../../../test/spm'));
  return dirs.join(' ');
});


/**
 * Test Help.
 */
Test.prototype.__defineGetter__('help', function() {
  return message.TEST_HELP;
});


module.exports = Test;
