
/**
 * @fileoverview Test Cases for sbuild.
 * @usage
 *   node path/to/test.js
 */

var path = require('path');
var assert = require('assert');


console.log('\033[36m  test extract: \033[0m');
var extract = require('../../lib/sbuild/extract');
assert.ok(extract.run(getFile('math/program')).indexOf('define([ "./increment" ]') === 0);


console.log('\033[36m  test combo: \033[0m');
var combo = require('../../lib/sbuild/combo');


console.log('\033[36m    test math: \033[0m');
var out = combo.run(getFile('math/program'));
assert.ok(out.indexOf('define("./program",["./increment"]') !== -1);
assert.ok(out.indexOf('define("./increment",["./math"]') !== -1);
assert.ok(out.indexOf('define("./math",[]') !== -1);


console.log('\033[36m    test require-css: \033[0m');
out = combo.run(getFile('require-css/program'));
assert.ok(out.indexOf('define("./program",["./style.css"]') !== -1);


console.log('\033[36m    test define-json: \033[0m');
out = combo.run(getFile('define-json/program'));
assert.ok(out.indexOf('define("./program",["./array","./object","./primitive"]') !== -1);
assert.ok(out.indexOf('define("./array",[]') !== -1);


console.log('\033[36m    test top-level: \033[0m');
out = combo.run(getFile('top-level/program'), '', true);
assert.ok(out.indexOf('define("querystring/1.0.0/querystring",[],function') !== -1);


console.log('\033[36m    test config-alias: \033[0m');
var alias = require('../../lib/sbuild/alias');
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


console.log('\033[32m  All PASSED!\033[0m');


// Helpers
function getFile(file) {
  return path.join(__dirname, file);
}
