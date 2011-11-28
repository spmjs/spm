/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Combo = require('../../lib/utils/combo.js');


var DATA_DIR = path.resolve(__dirname, '../data/modules');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

var file, expected, expected2, out;


// {{{
console.log('  test Combo.compile math');

file = getFile('math/program.js');
expected = path.join(path.dirname(file), 'expected/combo.js');
out = Combo.compile(file, null, { app_url: 'http://test.com/js/' });
assert.equal(out, getCode(expected));
// }}}


// {{{
console.log('\n  test Combo.compile top_level');

file = getFile('top_level/program.js');
expected = path.join(path.dirname(file), 'expected/combo.js');
expected2 = path.join(path.dirname(file), 'expected/combo_all.js');

// only relative
out = Combo.compile(file, null, { app_url: 'http://test.com/js/' });
assert.equal(out, getCode(expected));

// combine all
out = Combo.compile(file, null, {
  combine_all: true,
  base_path: path.join(path.dirname(file), 'lib'),
  app_url: 'http://test.com/js'
});
assert.equal(out, getCode(expected2));
// }}}


// {{{
console.log('\n  test Combo.compile require_css');

file = getFile('require_css/program.js');
expected = path.join(path.dirname(file), 'expected/combo.js');
out = Combo.compile(file, null, { app_url: 'http://test.com/js/' });
assert.equal(out, getCode(expected));
// }}}


// {{{
console.log('\n  test Combo.compile define_json');

file = getFile('define_json/program.js');
expected = path.join(path.dirname(file), 'expected/combo.js');
out = Combo.compile(file, null, { app_url: 'http://test.com/js/' });
assert.equal(out, getCode(expected));
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}


function getCode(filename) {
  return fs.readFileSync(filename, 'utf8');
}
