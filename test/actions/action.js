/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var path = require('path');
var assert = require('assert');

var Action = require('../../lib/actions/Action.js');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Action#_parseArgs');

var parseArgs = Action.prototype._parseArgs;
var result;

result = parseArgs('a');
assert.equal(result.modules[0], 'a');


result = parseArgs('a b c');
assert.equal(result.modules[0], 'a');
assert.equal(result.modules[1], 'b');
assert.equal(result.modules[2], 'c');


result = parseArgs('--version');
assert.equal('--version' in result.options, false);


result = parseArgs('--version', {
  version: { alias: ['-v', '--version'] }
});
assert.equal('--version' in result.options, false);
assert.equal('version' in result.options, true);
assert.equal(result.options['version'], true);


result = parseArgs('--version 1.2.0', {
  version: { alias: ['-v', '--version'], length: 1 }
});
assert.equal(result.options['version'], '1.2.0');


result = parseArgs('-v 1.2.0', {
  version: { alias: ['-v', '--version'], length: 1 }
});
assert.equal(result.options['version'], '1.2.0');


result = parseArgs('--version 1.2.0 1.1.0', {
  version: { alias: ['-v', '--version'], length: 2 }
});
assert.equal(result.options['version'][1], '1.1.0');


assert['throws'](function() {
  parseArgs('--version', {
    version: { alias: ['-v', '--version'], length: 1 }
  });
}, /not enough/);


result = parseArgs('--version 1.2.0 1.1.0 a b', {
  version: { length: 2, alias: ['--version'] }
});
assert.equal(result.options['version'][1], '1.1.0');
assert.equal(result.modules[1], 'b');


result = parseArgs('a b --version 1.2.0 1.1.0', {
  version: { length: 2, alias: ['--version'] }
});
assert.equal(result.options['version'][1], '1.1.0');
assert.equal(result.modules[1], 'b');


result = parseArgs('a.js --o1 --o2 path', {
  'o1': { alias: ['--o1'] },
  'o2': { length: 1, alias: ['--o2']
  }
});
assert.equal(result.modules.length, 1);
assert.equal(result.modules[0], 'a.js');


result = parseArgs(['a.js', '-f'], {
  force: {
    alias: ['--force', '-f']
  }
});
assert.equal(result.modules.length, 1);
assert.equal(result.options.force, true);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
