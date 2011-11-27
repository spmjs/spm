/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var path = require('path');
var assert = require('assert');

var LoaderConfig = require('../../lib/utils/loader_config.js');


var DATA_DIR = path.resolve(__dirname, '../data/configs');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test SeaConfig.parseAlias');

var alias;
alias = LoaderConfig.parseAlias(getFile('seajs_config.js'));
assert.equal(alias['increment'], 'increment.js?t=20110530');
assert.equal(alias['lib'], './lib');
assert.equal(alias['underscore'], 'underscore/1.1.6/underscore');

alias = LoaderConfig.parseAlias(getFile('seajs_config_2.js'));
assert.equal(alias['increment'], 'increment.js?t=20110530');
assert.equal(alias['lib'], './lib');
assert.equal(alias['underscore'], 'underscore/1.1.6/underscore');
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
