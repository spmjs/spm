/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fsExt');
var Build = require('../../lib/actions/Build');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

const DATA_DIR = path.join(__dirname, '../data/modules');
var build;


// {{{
console.log('  test build --clear');

build = new Build([], { clear: true });
fsExt.mkdirS('__build');
build.run();
assert.equal(path.existsSync('__build'), false);
// }}}


// {{{
console.log('\n  test build a.js');

build = new Build([getFile('math/program.js')]);
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/program.js');
// }}}


// {{{
console.log('\n  test build a.js --combine');

build = new Build([getFile('math/program.js')], { combine: true });
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all');

build = new Build([getFile('math/program.js')], { combine_all: true });
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine --libs_path exists');

build = new Build([getFile('top_level/program.js')], {
  combine: true,
  libs_path: getFile('top_level/lib')
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all --libs_path exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  libs_path: getFile('top_level/lib')
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo_all.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all --config exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  config: getFile('top_level/build_config.js')
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo_all_2.js');
// }}}


// {{{
console.log('\n  test build a.js --libs_path not-exists');

build = new Build([getFile('top_level/program.js')], {
  combine: true,
  libs_path: getFile('top_level/libs')
});

assert['throws'](function() {
  build.run();
}, /No such/);
// }}}


// {{{
console.log('\n  test build a.js --config not-exists');

build = new Build([getFile('top_level/program.js')], {
  combine: true,
  config: getFile('top_level/libs')
});

assert['throws'](function() {
  build.run();
}, /No such/);
// }}}


// {{{
console.log('\n  test build a.js --combine_all --libs_path exists --config exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  libs_path: getFile('top_level/lib'),
  config: getFile('top_level/build_config.js')
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo_all.js');
// }}}


// {{{
console.log('\n  test build path');

build = new Build([getFile('math')]);
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/program.js');
assertFileContentEqual('math/__build/increment.js', 'math/expected/increment.js');
assertFileContentEqual('math/__build/math.js', 'math/expected/math.js');
// }}}


// {{{
console.log('\n  test build path -r');

build = new Build([getFile('deep')], { recursive: true });
build.run();
assertFileContentEqual('deep/sub/biz/__build/math.js', 'deep/expected/math.js');
// }}}


// clear tmp build files
Build.prototype.clear(DATA_DIR);


console.log((testName + ' is ').cyan + 'PASSED'.green);


// Helpers
function getFile(filename) {
  return DATA_DIR + '/' + filename;
}


function getCode(filename) {
  return fs.readFileSync(filename, 'utf8');
}


function assertFileContentEqual(file1, file2) {
  assert.equal(getCode(getFile(file1)), getCode(getFile(file2)));
}
