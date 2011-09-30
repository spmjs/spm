/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Completion = require('../../lib/actions/Completion');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

var comp;


// {{{
console.log('  test spm [TAB]');
comp = new Completion('spm');
console.log(comp.run());
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
