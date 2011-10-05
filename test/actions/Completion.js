/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var CONFIG = require('../../lib/config');
var Completion = require('../../lib/actions/Completion');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

var comp, expected;


// {{{
console.log('  test spm [TAB]');
expected = CONFIG.AVAILABLE_ACTIONS.join(' ').replace(' completion', '');

comp = new Completion('spm');
assert.equal(comp.run(), expected);

comp = new Completion('spm b');
assert.equal(comp.run(), expected);
// }}}


// {{{
console.log('  test spm action [TAB]');

comp = new Completion('build');
console.log(comp.run());
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
