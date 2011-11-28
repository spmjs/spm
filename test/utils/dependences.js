/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var path = require('path');
var assert = require('assert');

var Dependences = require('../../lib/utils/dependences.js');


var DATA_DIR = path.resolve(__dirname, '../data/dependences');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


//{{{
console.log('  test Dependences._parseStatic');

var deps;
var parseStatic = Dependences._parseStatic;

deps = parseStatic(getFile('static_deps_1.js'));
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');

deps = parseStatic(getFile('static_deps_2.js'));
assert.equal(deps.length, 0);

deps = parseStatic(getFile('static_deps_3.js'));
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = parseStatic(getFile('static_deps_4.js'));
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = parseStatic(getFile('dynamic_deps_1.js'));
assert.equal(deps, undefined);
// }}}


// {{{
console.log('  test Dependence._parseDynamic');
var parseDynamic = Dependences._parseDynamic;

deps = parseDynamic(getFile('dynamic_deps_1.js'));
assert.equal(deps.length, 0);

deps = parseDynamic(getFile('dynamic_deps_2.js'));
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');
// }}}


// {{{
console.log('  test Dependences.parse');
var parse = Dependences.parse;

deps = parse(getFile('deps_1.js'));
assert.equal(deps.length, 0);

deps = parse(getFile('deps_2.js'));
assert.equal(deps.length, 0);

deps = parse(getFile('deps_3.js'));
assert.equal(deps.length, 0);

deps = parse(getFile('deps_4.js'));
assert.equal(deps.length, 0);

deps = parse(getFile('deps_5.js'));
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');

deps = parse(getFile('deps_6.js'));
assert.equal(deps.length, 0);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
