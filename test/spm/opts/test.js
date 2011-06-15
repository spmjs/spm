// vim: set ts=2 sw=2:
var assert = require('assert'),
    opts = require('../../../lib/spm/helper/opts');

exports.run = function() {
  var opt1;

  opt1 = opts.parse(['a']);
  assert.equal(opt1.mods[0], 'a', 'parse one single module');

  opt1 = opts.parse(['--version']);
  assert.ok(opt1.config['--version'][0], 'parse one single options');

  opt1 = opts.parse(['--version'], {'version': {alias: ['-v', '--version']}});
  assert.ok(opt1.config['version'][0], 'parse one options alias');

  opt1 = opts.parse(['--version', '1.2.0'], {'--version': {length: 1}});
  assert.equal(opt1.config['--version'][0], '1.2.0', 'parse multiple options');

  try {
    opts.parse(['--version'], {'version': {
      alias: ['-v', '--version'], length: 1}});
  } catch (e) {
    assert.equal(e,
        opts.OPTION_ARGUMENTS_NOT_ENOUGH,
        'options not enough exceptions');
  }
};
