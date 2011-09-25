// vim: set ts=2 sw=2:

require('colors');

var assert = require('assert');
var argumentsParser = require('../../lib/helper/arguments_parser');


var result;

result = argumentsParser(['a']);
assert.equal(result.modules[0], 'a');


result = argumentsParser(['a', 'b', 'c']);
assert.equal(result.modules[0], 'a');
assert.equal(result.modules[1], 'b');
assert.equal(result.modules[2], 'c');


result = argumentsParser(['--version']);
assert.equal('--version' in result.options, false);


result = argumentsParser(['--version'], {
  version: { alias: ['-v', '--version'] }
});
assert.equal('--version' in result.options, false);
assert.equal('version' in result.options, true);
assert.equal(result.options['version'].length, 0);


result = argumentsParser(['--version', '1.2.0'], {
  version: { alias: ['-v', '--version'], length: 1 }
});
assert.equal(result.options['version'][0], '1.2.0');


result = argumentsParser(['--version', '1.2.0', '1.1.0'], {
  version: { alias: ['-v', '--version'], length: 2 }
});
assert.equal(result.options['version'][1], '1.1.0');


assert['throws'](function() {
  argumentsParser(['--version'], {
    version: { alias: ['-v', '--version'], length: 1 }
  });
}, /not enough/);


result = argumentsParser(['--version', '1.2.0', '1.1.0', 'a', 'b'], {
  version: { length: 2, alias: ['--version'] }
});
assert.equal(result.options['version'][1], '1.1.0');
assert.equal(result.modules[1], 'b');


result = argumentsParser(['a', 'b', '--version', '1.2.0', '1.1.0'], {
  version: { length: 2, alias: ['--version'] }
});
assert.equal(result.options['version'][1], '1.1.0');
assert.equal(result.modules[1], 'b');


console.log('100% passed!'.green);
