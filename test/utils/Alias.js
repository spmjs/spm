/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Alias = require('../../lib/utils/Alias');


var DATA_DIR = path.resolve(__dirname, '../data/alias');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Alias.parse');

var alias;
alias = Alias.parse(getFile('app_config.js'));
assert.equal(alias['increment'], 'increment.js?t=20110530');
assert.equal(alias['lib'], './lib');
assert.equal(alias['underscore'], 'underscore/1.1.6/underscore');

alias = Alias.parse(getFile('app_config_2.js'));
assert.equal(alias['increment'], 'increment.js?t=20110530');
assert.equal(alias['lib'], './lib');
assert.equal(alias['underscore'], 'underscore/1.1.6/underscore');
// }}}


// {{{
console.log('  test Alias.parseAliasInDependences');

var deps = ['lib', 'underscore', 'increment'];
Alias.parseAliasInDependences(alias, deps);
assert.equal(deps[0], './lib');
assert.equal(deps[1], 'underscore/1.1.6/underscore');
assert.equal(deps[2], 'increment.js?t=20110530');
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
