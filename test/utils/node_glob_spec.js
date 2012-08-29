var glob = require('glob');
var path = require('path');

var moduleAdir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");

var dir = '/Users/kanghui/Projects/alipay-project2/arale2/switchable';
describe('node glob test', function() {
  it('test dir', function() {
    var files = glob.sync('**/*.js', {cwd: moduleAdir});
    expect(files.length).toBe(9);

    var debugFiles = glob.sync('**/*-debug.js', {cwd: moduleAdir});
    expect(debugFiles.length).toBe(2);

    var files = glob.sync('dist/templatable-debug.js', {cwd: path.join(moduleAdir)});
    expect(files.length).toBe(1);
    console.info(files)
  });
});

