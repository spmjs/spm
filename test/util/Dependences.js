/**
 * @fileoverview Test cases for Dependences.
 * @author lifesinger@gmail.com (Frank Wang)
 */

process.DEBUG = false;
require('colors');

var assert = require('assert');
var Dependences = require('../../lib/util/Dependences');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);


var deps;

console.log('  test Dependences.parseStatic_');
var parseStatic = Dependences.parseStatic_;

deps = parseStatic('data/static_deps_1.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');

deps = parseStatic('data/static_deps_2.js');
assert.equal(deps.length, 0);

deps = parseStatic('data/static_deps_3.js');
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = parseStatic('data/static_deps_4.js');
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = parseStatic('data/dynamic_deps_1.js');
assert.equal(deps, undefined);


console.log('  test Dependence.parseDynamic_');
var parseDynamic = Dependences.parseDynamic_;

deps = parseDynamic('data/dynamic_deps_1.js');
assert.equal(deps.length, 0);

deps = parseDynamic('data/dynamic_deps_2.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');


console.log('  test Dependences.parse');
var parse = Dependences.parse;

deps = parse('data/deps_1.js');
assert.equal(deps.length, 0);

deps = parse('data/deps_2.js');
assert.equal(deps.length, 0);

deps = parse('data/deps_3.js');
assert.equal(deps.length, 0);

deps = parse('data/deps_4.js');
assert.equal(deps.length, 0);

deps = parse('data/deps_5.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');


console.log((testName + ' is ').cyan + 'PASSED'.green);
