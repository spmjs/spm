/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Completion = require('../../lib/actions/Completion');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Action.prototype.parseArgs_');

// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
