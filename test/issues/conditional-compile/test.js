/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../../lib/utils/colors.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Build = require('../../../lib/actions/build.js');


// BEGIN
var testName = path.basename(__dirname);
console.log(('test ' + testName).cyan);


// `spm build main.js`
var build = new Build([getFile('main.js')], {
  config: getFile('build-config.js')
});
build.run();
assertFileContentEqual('expected/main.js', '__build/main.js');
build.clear(__dirname);


// END
console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return path.join(__dirname, filename);
}


function getCode(filename) {
  return fs.readFileSync(getFile(filename), 'utf8');
}


function assertFileContentEqual(file1, file2) {
  assert.equal(getCode(file1), getCode(file2));
}
