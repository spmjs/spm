
/**
 * @fileoverview Test Cases for sbuild.
 * @usage
 *   cd test/sbuild
 *   node test.js
 */

var path = require('path');
var assert = require('assert');


var extract = require('../../lib/extract');
assert.ok(extract.run(getFile('math/program')).indexOf('define([ "./increment" ]') === 0);


var combo = require('../../lib/combo');

var out = combo.run(getFile('math/program'));
assert.ok(out.indexOf('define("./program",["./increment"]') !== -1);
assert.ok(out.indexOf('define("./increment",["./math"]') !== -1);
assert.ok(out.indexOf('define("./math",[]') !== -1);

out = combo.run(getFile('require-css/program'));
assert.ok(out.indexOf('define("./program",["./style.css"]') !== -1);

out = combo.run(getFile('define-json/program'));
assert.ok(out.indexOf('define("./program",["./array","./object","./primitive"]') !== -1);
assert.ok(out.indexOf('define("./array",[]') !== -1);

out = combo.run(getFile('top-level/program'), '', true);
assert.ok(out.indexOf('define("querystring/1.0.0/querystring",[],function') !== -1);


console.log('\033[32m  All PASSED!\033[0m');


// Helpers
function getFile(file) {
  return path.join(__dirname, file);
}
