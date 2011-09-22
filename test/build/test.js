// vim: set ts=2 sw=2:

/**
 * @fileoverview Test Cases for sbuild.
 */

require('colors');
var path = require('path');
var assert = require('assert');


console.log('  test extract: '.cyan);
var extract = require('../../lib/helper/meta_extractor');
assert.ok(extract.run(getFile('math/program')).indexOf('define([ "./increment" ]') === 0);


console.log('  test combo: '.cyan);
var combo = require('../../lib/actions/build/combo');


console.log('    test math: '.cyan);
var out = combo.run(getFile('math/program'));
assert.ok(out.indexOf('define("./program",["./increment"]') !== -1);
assert.ok(out.indexOf('define("./increment",["./math"]') !== -1);
assert.ok(out.indexOf('define("./math",[]') !== -1);


console.log('    test require-css: '.cyan);
out = combo.run(getFile('require-css/program'));
assert.ok(out.indexOf('define("./program",["./style.css"]') !== -1);


console.log('    test define-json: '.cyan);
out = combo.run(getFile('define-json/program'));
assert.ok(out.indexOf('define("./program",["./array","./object","./primitive"]') !== -1);
assert.ok(out.indexOf('define("./array",[]') !== -1);


console.log('    test top-level: '.cyan);
out = combo.run(getFile('top-level/program'), '', true);
assert.ok(out.indexOf('define("querystring/1.0.0/querystring",[]') !== -1);


console.log('    test config-alias: '.cyan);
var alias = require('../../lib/helper/alias');
var deps = ['./sub/increment', 'querystring:1.0.0', 'lib/math'];
deps = alias.parse(deps, getFile('config-alias/app-config.js'));
console.log(deps);

assert.ok(deps[0] === './sub/increment.js?t=20110530');
assert.ok(deps[1] === 'querystring/1.0.0/querystring');
assert.ok(deps[2] === './lib/math');

out = combo.run(getFile('config-alias/program'), '', true);
assert.ok(out.indexOf('define("./program",["./sub/increment","querystring:1.0.0"]') !== -1);
assert.ok(out.indexOf('define("./sub/increment",["lib/math"]') !== -1);
assert.ok(out.indexOf('define("./sub/lib/math",[]') !== -1);
assert.ok(out.indexOf('define("querystring/1.0.0/querystring",[]') !== -1);


console.log('  All PASSED!'.cyan);


// Helpers
function getFile(file) {
  return path.join(__dirname, file);
}

