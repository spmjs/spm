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


console.log('  test Transport.parse');

Transport.parse(DATA_DIR + '/remote_package.js', function(o) {
  assert.equal(o.meta.name, 'SeaJS');
});

Transport.parse(DATA_DIR + '/remote_package_overwrite.js', function(o) {
  assert.equal(o.meta.version, '0.1.0');
});

Transport.parse(DATA_DIR + '/local_package.js', function(o) {
  assert.equal(o.name, 'SeaJS');
});


console.log((testName + ' is ').cyan + 'PASSED'.green);
