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

const DATA_DIR = path.join(__dirname, '../data');
var build, modules;


// {{{
console.log('  test --clear');

build = new Build([], { clear: true });
fsExt.mkdirS('__build');
build.run();
assert.equal(path.existsSync('__build'), false);
// }}}


// {{{
console.log('  test --libs');
modules = [getFile('modules/math/program.js')];

build = new Build(modules, { config: getFile('configs/build_config.js') });
build.run();
assert.equal(build.options.base, 'http://a.tbcdn.cn/libs');
// }}}


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}
