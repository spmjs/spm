/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Combo = require('../../lib/utils/Combo');


var DATA_DIR = path.resolve(__dirname, '../data/modules');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Combo.compile');

var file = getFile('math/program.js');
var expected = path.join(path.dirname(file), 'expected.js');
var out = Combo.compile(file);
assert.equal(out, getCode(expected));
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}


function getCode(filename) {
  return fs.readFileSync(filename, 'utf-8');
}
