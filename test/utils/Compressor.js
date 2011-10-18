/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var Compressor = require('../../lib/utils/Compressor');


var DATA_DIR = path.resolve(__dirname, '../data');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Compressor.getMeta_');

var meta;
var file = getFile('dependences/static_deps_1.js');

meta = Compressor.getMeta_(file, { from: __filename });
assert.equal(meta.deps.length, 2);
assert.equal(meta.deps[0], 'a');
assert.equal(meta.deps[1], 'b');
assert.equal(meta.id, '../data/dependences/static_deps_1');

meta = Compressor.getMeta_(file, { from: file });
assert.equal(meta.id, './static_deps_1');

meta = Compressor.getMeta_(file, { libs_path: file });
assert.equal(meta.id, 'static_deps_1');
// }}}


// {{{
console.log('  test Compressor.compress');

var cases = [
    ['static_deps_1', 'define("./static_deps_1",["a","b"],function(){});']
    ,['static_deps_2', 'define("./static_deps_2",[],function(){});']
    ,['static_deps_3', 'define("id",["a"],function(){});']
    ,['static_deps_4', 'var fn=function(){};define("./static_deps_4",["a"],fn);']
    ,['dynamic_deps_1', 'define("./dynamic_deps_1",[],function(){});']
    ,['dynamic_deps_2', 'define("./dynamic_deps_2",["a","b"],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_1', 'define("./deps_1",[],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_2', 'function a(){}define("./deps_2",[],a);']
    ,['deps_3', '(function(a){typeof define=="function"?define("./deps_3",[],a):a(null,this.XX={})})(function(a,b){b.version="1.0.0"});']
    ,['deps_4', '(function(a){typeof define=="function"?define("./deps_4",[],a):a(null,this.XX={})})(function(a,b){a("a"),b.version="1.0.0"});']
    ,['deps_5', '(function(a){typeof define=="function"?define("define8",["a","b"],a):a(null,this.XX={})})(function(a,b){a("c"),b.version="1.0.0"});']
    ,['meta_1', 'define("meta_1",[],function(){});']
    ,['meta_2', 'define("./meta_2",[],{});']
];

cases.forEach(function(item) {
  file = getFile('dependences/' + item[0] + '.js');
  var out = Compressor.compress(file, null, { from: file });
  //console.log(out);
  assert.equal(out, item[1]);
});
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
