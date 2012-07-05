/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fs_ext.js');
var Install = require('../../lib/actions/install.js');

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
install = new Install(['not-exists'], {
  from: MODULES_DIR
});
install.run(function(data) {
  assert.equal(data.errCode, -2);
});

// spm install local-exists
install = new Install(['json'], {
  from: MODULES_DIR,
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
  from: MODULES_DIR,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(getMinPath(meta)), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  fsExt.rmdirRF(getFile(meta.name));
});
// }}}


// {{{
console.log('  test install jquery@1.6.4');

install = new Install(['jquery@1.6.4'], {
  force: true,
  from: MODULES_DIR,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(getMinPath(meta)), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  fsExt.rmdirRF(getFile(meta.name));
});
// }}}


// {{{
console.log('  test install backbone with dependencies');

install = new Install(['backbone'], {
  force: true,
  from: MODULES_DIR,
  to: DATA_DIR
});

var actual = [];

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(getMinPath(meta)), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  actual.push(meta.name);
  fsExt.rmdirRF(getFile(meta.name));
});

setTimeout(function() {
  assert.equal(actual.join('')
      .replace('backbone', '')
      .replace('underscore', ''),
      0);

  fsExt.rmdirRF(getFile('backbone'));
  fsExt.rmdirRF(getFile('underscore'));
}, 2000);
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

  assert.equal(getCode(getMinPath(meta)), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

  assert.ok(fs.existsSync(
      path.join(path.dirname(getMinPath(meta)), 'plugin-map.js')
  ));

  fsExt.rmdirRF(getFile(meta.name));
});
// }}}


// {{{
console.log('  test install querystring es5-safe');

install = new Install(['querystring', 'es5-safe'], {
  force: true,
  from: MODULES_DIR,
  to: DATA_DIR
});

install.run(function(data) {
  var meta = data.meta;
  assert.equal(getCode(getMinPath(meta)), getCode(
      path.join(MODULES_DIR, meta.name, meta.version, meta.filename + '.js')
  ));

});

setTimeout(function() {
  fsExt.rmdirRF(getFile('querystring'));
  fsExt.rmdirRF(getFile('es5-safe'));
}, 2000);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}


function getCode(filename) {
  return fs.readFileSync(filename, 'utf8');
}


function getMinPath(meta) {
  return path.join(meta.installTo, meta.installFiles[0]);
}
