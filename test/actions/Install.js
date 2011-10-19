/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fsExt');
var Install = require('../../lib/actions/Install');
const DATA_DIR = path.resolve(__dirname, '../data/install');
const MODULES_DIR = path.resolve(__dirname, '../../modules');

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
install = new Install(['json'], {
  to: DATA_DIR
});
install.run(function(data) {
  assert.equal(data.errCode, -3);
});
// }}}


// {{{
console.log('  test install cookie');

install = new Install(['cookie'], {
  force: true,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(meta.localminpath), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  fsExt.rmdirRF(getFile('cookie'));
});
// }}}


// {{{
console.log('  test install mustache --from local');

install = new Install(['mustache'], {
  force: true,
  from: MODULES_DIR,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(meta.localminpath), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  fsExt.rmdirRF(getFile('mustache'));
});
// }}}


// {{{
console.log('  test install seajs');

install = new Install(['seajs'], {
  force: true,
  from: MODULES_DIR,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;

  assert.equal(getCode(meta.localminpath), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  assert.ok(path.existsSync(
      path.join(path.dirname(meta.localminpath), 'plugin-map.js')
  ));

  fsExt.rmdirRF(getFile('seajs'));
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
