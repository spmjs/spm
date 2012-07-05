/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('../../lib/utils/colors.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var fsExt = require('../../lib/utils/fs_ext.js');
var Build = require('../../lib/actions/build.js');


var testName = path.basename(__filename);
console.log(('test ' + testName).cyan);

const DATA_DIR = path.join(__dirname, '../data/modules');
var build;


// {{{
console.log(process.cwd());
console.log('  test build --clear');

build = new Build([], { clear: true });
fsExt.mkdirS('__build');
build.run();
assert.equal(fs.existsSync('__build'), false);
// }}}


// {{{
console.log('  test build --clear xx');

build = new Build(['__xx'], { clear: true });
fsExt.mkdirS('__xx');
fsExt.mkdirS('__xx/__build');
build.run();
assert.equal(fs.existsSync('xx/__build'), false);
fsExt.rmdirRF('__xx');
// }}}


// {{{
console.log('\n  test build a.js');

build = new Build([getFile('math/program.js')]);
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/program.js');
// }}}


// {{{
console.log('\n  test build a.js --combine');

build = new Build([getFile('math/program.js')], { combine: true, app_url: 'http://test.com/js/' });
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all');

build = new Build([getFile('math/program.js')], { combine_all: true, app_url: 'http://test.com/js/' });
build.run();
assertFileContentEqual('math/__build/program.js', 'math/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine --base_path exists');

build = new Build([getFile('top_level/program.js')], {
  combine: true,
  base_path: getFile('top_level/lib'),
  app_url: 'http://test.com/js/'
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all --base_path exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  base_path: getFile('top_level/lib'),
  app_url: 'http://test.com/js/'
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo_all.js');
// }}}


// {{{
console.log('\n  test build a.js --combine_all --config exists');

build = new Build([getFile('top_level/program.js')], {
  config: getFile('top_level/build_config.js')
});
build.run();
assertFileContentEqual('top_level/__build/program.js', 'top_level/expected/combo_all_2.js');
// }}}


// {{{
console.log('\n  test build a.js --base_path not-exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  app_url: 'http://test.com/js',
  base_path: getFile('top_level/xx_libs')
});

assert['throws'](function() {
  build.run();
}, /No such/);
// }}}


// {{{
console.log('\n  test build a.js --config not-exists');

build = new Build([getFile('top_level/program.js')], {
  combine: true,
  app_url: 'http://test.com/js',
  config: getFile('top_level/xx_libs')
});

assert['throws'](function() {
  build.run();
}, /No such/);
// }}}


// {{{
console.log('\n  test build a.js --combine_all --base_path exists --config exists');

build = new Build([getFile('top_level/program.js')], {
  combine_all: true,
  base_path: getFile('top_level/lib'),
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


// {{{
console.log('\n  test build a.js --excludes');

build = new Build([getFile('excludes/program.js')], {
  config: getFile('excludes/build-config.js')
});
build.run();
assertFileContentEqual('excludes/__build/program.js', 'excludes/expected/combo.js');

build = new Build([getFile('excludes/program.js')], {
  config: getFile('excludes/build-config.js'),
  excludes: /lib-x/
});
build.run();
assertFileContentEqual('excludes/__build/program.js', 'excludes/expected/combo_2.js');
// }}}


// {{{
console.log('\n  test build a.js with compiler_options in build-config.js');

build = new Build([getFile('compiler_options')], {
  config: getFile('compiler_options/build-config.js')
});
build.run();
assertFileContentEqual('compiler_options/__build/main.js', 'compiler_options/expected/main.js');
// }}}


// {{{
console.log('\n  test build a.js --out_path');
fsExt.rmdirRF(getFile('out_path/z/x/c'));

build = new Build([getFile('out_path/main.js')], {
  config: getFile('out_path/build-config.js')
});
build.run();
assert(fs.existsSync(getFile('out_path/z/x/c/main.js')));

fsExt.rmdirRF(getFile('out_path/z/x/c'));
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
