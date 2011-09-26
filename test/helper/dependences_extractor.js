/**
 * @fileoverview Test cases for dependences extractor.
 * @author lifesinger@gmail.com (Frank Wang)
 */

process.DEBUG = false;
require('colors');

var assert = require('assert');
var extractor = require('../../lib/helper/dependences_extractor');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);


var deps;

console.log('  test getStaticDependences');

deps = extractor.getStaticDependencies('data/static_deps_1.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');

deps = extractor.getStaticDependencies('data/static_deps_2.js');
assert.equal(deps.length, 0);

deps = extractor.getStaticDependencies('data/static_deps_3.js');
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = extractor.getStaticDependencies('data/static_deps_4.js');
assert.equal(deps.length, 1);
assert.equal(deps[0], 'a');

deps = extractor.getStaticDependencies('data/dynamic_deps_1.js');
assert.equal(deps, undefined);


console.log('  test getDynamicDependences');

deps = extractor.getDynamicDependencies('data/dynamic_deps_1.js');
assert.equal(deps.length, 0);

deps = extractor.getDynamicDependencies('data/dynamic_deps_2.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');


console.log('  test getDependences');

deps = extractor.getDependencies('data/deps_1.js');
assert.equal(deps.length, 0);

deps = extractor.getDependencies('data/deps_2.js');
assert.equal(deps.length, 0);

deps = extractor.getDependencies('data/deps_3.js');
assert.equal(deps.length, 0);

deps = extractor.getDependencies('data/deps_4.js');
assert.equal(deps.length, 0);

deps = extractor.getDependencies('data/deps_5.js');
assert.equal(deps.length, 2);
assert.equal(deps[0], 'a');
assert.equal(deps[1], 'b');


console.log((testName + ' is ').cyan + 'PASSED'.green);
