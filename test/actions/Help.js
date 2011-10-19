/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Help = require('../../lib/actions/Help');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test spm help');
assert.ok(new Help().run().indexOf('seajs') > -1);
// }}}


// {{{
console.log('  test spm help build');
assert.ok(new Help('build').run().indexOf('build') > -1);
// }}}


// {{{
console.log('  test spm help not-exists');
assert.ok(new Help('xx').run().indexOf('Unknown') > -1);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
