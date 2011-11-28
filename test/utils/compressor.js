/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var path = require('path');
var assert = require('assert');

var Compressor = require('../../lib/utils/compressor.js');


var DATA_DIR = path.resolve(__dirname, '../data');
var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);


// {{{
console.log('  test Compressor._getMeta');

var meta;
var file = getFile('dependences/static_deps_1.js');

meta = Compressor._getMeta(file, { root_path: __filename, root_url: 'http://test.com/js/' });
assert.equal(meta.deps.length, 2);
assert.equal(meta.deps[0], 'a');
assert.equal(meta.deps[1], 'b');
assert.equal(meta.id, 'http://test.com/data/dependences/static_deps_1.js');

meta = Compressor._getMeta(file, { root_url: 'http://test.com/js/' });
assert.equal(meta.id, 'http://test.com/js/static_deps_1.js');

meta = Compressor._getMeta(file);
assert.equal(meta.id, '');
// }}}


// {{{
console.log('  test Compressor.compress');

var cases = [
    ['static_deps_1', 'define(["a","b"],function(){});']
    ,['static_deps_2', 'define([],function(){});']
    ,['static_deps_3', 'define("id",["a"],function(){});']
    ,['static_deps_4', 'var fn=function(){};define(["a"],fn);']
    ,['dynamic_deps_1', 'define([],function(){});']
    ,['dynamic_deps_2', 'define(["a","b"],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_1', 'define([],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_2', 'function a(){}define([],a);']
    ,['deps_3', '(function(a){typeof define=="function"?define([],a):a(null,this.XX={})})(function(a,b){b.version="1.0.0"});']
    ,['deps_4', '(function(a){typeof define=="function"?define([],a):a(null,this.XX={})})(function(a,b){a("a"),b.version="1.0.0"});']
    ,['deps_5', '(function(a){typeof define=="function"?define("test",["a","b"],a):a(null,this.XX={})})(function(a,b){a("c"),b.version="1.0.0"});']
    ,['meta_1', 'define("meta_1",[],function(){});']
    ,['meta_2', 'define([],{});']
];

cases.forEach(function(item) {
  file = getFile('dependences/' + item[0] + '.js');
  var out = Compressor.compress(file);
  //console.log(out);
  assert.equal(out, item[1]);
});
// }}}


// {{{
console.log('  test Compressor.compress with id');

cases = [
    ['static_deps_1', 'define("http://test.com/js/static_deps_1.js",["a","b"],function(){});']
    ,['static_deps_2', 'define("http://test.com/js/static_deps_2.js",[],function(){});']
    ,['static_deps_3', 'define("id",["a"],function(){});']
    ,['static_deps_4', 'var fn=function(){};define("http://test.com/js/static_deps_4.js",["a"],fn);']
    ,['dynamic_deps_1', 'define("http://test.com/js/dynamic_deps_1.js",[],function(){});']
    ,['dynamic_deps_2', 'define("http://test.com/js/dynamic_deps_2.js",["a","b"],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_1', 'define("http://test.com/js/deps_1.js",[],function(a){a("a"),a("b");var b="d";a(b),a("e1e2")});']
    ,['deps_2', 'function a(){}define("http://test.com/js/deps_2.js",[],a);']
    ,['deps_3', '(function(a){typeof define=="function"?define("http://test.com/js/deps_3.js",[],a):a(null,this.XX={})})(function(a,b){b.version="1.0.0"});']
    ,['deps_4', '(function(a){typeof define=="function"?define("http://test.com/js/deps_4.js",[],a):a(null,this.XX={})})(function(a,b){a("a"),b.version="1.0.0"});']
    ,['deps_5', '(function(a){typeof define=="function"?define("test",["a","b"],a):a(null,this.XX={})})(function(a,b){a("c"),b.version="1.0.0"});']
    ,['meta_1', 'define("meta_1",[],function(){});']
    ,['meta_2', 'define("http://test.com/js/meta_2.js",[],{});']
];

cases.forEach(function(item) {
  file = getFile('dependences/' + item[0] + '.js');
  var out = Compressor.compress(file, null, { root_path: getFile('dependences'), root_url: 'http://test.com/js/' });
  //console.log(out);
  assert.equal(out, item[1]);
});
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
