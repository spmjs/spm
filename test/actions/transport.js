/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fs_ext.js');
var Transport = require('../../lib/actions/transport.js');
const DATA_DIR = path.resolve(__dirname, '../data/transports');

var testName = require('path').basename(__filename);
console.log(('test ' + testName).cyan);

var transport;


// {{{
console.log('  test Transport#run');

transport = new Transport();
transport.run(function(data) {
  assert.equal(data.errCode, -1);
});

transport = new Transport('not-exists.js');
transport.run(function(data) {
  assert.equal(data.errCode, -2);
});
// }}}


// {{{
console.log('  test Transport#transport seajs');

transport = new Transport([getFile('seajs_transport.js')]);
transport.run(function(data) {
  var meta = data.meta;

  assert.ok(meta['package']);
  assert.ok(meta['src']);
  assert.equal(meta['name'], 'SeaJS');
  assert.equal(meta['version'], '1.1.0');

  assert.equal(getCode(data.srcOutputFile), getCode(meta['src']));
  assert.equal(getCode(data.minOutputFile), getCode(meta['min']));

  // destroy
  fsExt.rmdirRF(path.dirname(data.srcOutputFile));
});
// }}}


// {{{
console.log('  test Transport#transport mustache');

transport = new Transport([getFile('mustache_transport.js')], { force: true });
transport.run(function(data) {
  var meta = data.meta;

  assert.equal(meta['name'], 'mustache');
  assert.equal(meta['version'], '0.4.0');
  assert.ok(getCode(data.srcOutputFile).indexOf("define('#mustache") !== -1);
  assert.ok(getCode(data.minOutputFile).indexOf('define("#mustache') !== -1);

  // destroy
  fsExt.rmdirRF(path.dirname(data.srcOutputFile));
});
// }}}


// {{{
console.log('  test Transport#transport backbone');

transport = new Transport([getFile('backbone_transport.js')], { force: true });
transport.run(function(data) {
  var meta = data.meta;

  assert.equal(meta['name'], 'backbone');
  assert.ok(getCode(data.srcOutputFile).indexOf("define('#backbone") !== -1);
  assert.ok(getCode(data.minOutputFile).indexOf("define('#backbone") !== -1);

  // destroy
  fsExt.rmdirRF(path.dirname(data.srcOutputFile));
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
