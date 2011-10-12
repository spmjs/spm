/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Transport = require('../../lib/actions/Transport');
const DATA_DIR = path.resolve(__dirname, '../data/transports');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);

var transport;


// {{{
console.log('  test Transport#run');

transport = new Transport();
assert.equal(transport.run(), -1);

transport = new Transport('not-exists.js');
assert.equal(transport.run(), -2);
// }}}


// {{{
console.log('  test Transport#transport');

transport = new Transport(getFile('seajs_transport.js'));
transport.run({ callback: function(data) {

} });

// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
