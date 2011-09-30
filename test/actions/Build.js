/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fsExt');
var Build = require('../../lib/actions/Build');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

var build;


// {{{
console.log('  test --clear');

build = new Build([], { clear: true });
fsExt.mkdirS('__build');
build.run();
assert.equal(path.existsSync('__build'), false);
// }}}


// {{{
console.log('  test --config');

build = new Build([], { config: [''] });
fsExt.mkdirS('__build');
build.run();
assert.equal(path.existsSync('__build'), false);
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);
