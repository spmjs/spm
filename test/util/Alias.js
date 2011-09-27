/**
 * @fileoverview Test cases for Alias.
 * @author lifesinger@gmail.com (Frank Wang)
 */

process.DEBUG = false;
require('colors');

var assert = require('assert');
var Alias = require('../../lib/util/Alias');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);


console.log('  test Alias.parse');

var alias;
alias = Alias.parse('data/app-config.js');
assert.equal(alias['increment'], 'increment.js?t=20110530');
assert.equal(alias['lib'], './lib');
assert.equal(alias['underscore'], 'underscore/1.1.6/underscore');


console.log('  test Alias.parseAliasInDependences');

var deps = ['lib', 'underscore', 'increment'];
Alias.parseAliasInDependences(alias, deps);
assert.equal(deps[0], './lib');
assert.equal(deps[1], 'underscore/1.1.6/underscore');
assert.equal(deps[2], 'increment.js?t=20110530');


console.log((testName + ' is ').cyan + 'PASSED'.green);
