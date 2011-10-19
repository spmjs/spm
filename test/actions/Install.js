/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Install = require('../../lib/actions/Install');
const DATA_DIR = path.resolve(__dirname, '../data/install');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);


var install;


// {{{
console.log('  test install exceptions');

// spm install
install = new Install();
install.run(function(data) {
  assert.equal(data.errCode, -1);
});

// spm install not-exists
install = new Install('not-exists');
install.run(function(data) {
  assert.equal(data.errCode, -2);
});

// spm install local-exists
install = new Install(['backbone'], {
  to: DATA_DIR
});
install.run(function(data) {
  assert.equal(data.errCode, -3);
});
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}


function getCode(filename) {
  return fs.readFileSync(filename, 'utf8');
}
