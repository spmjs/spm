var glob = require('glob');
var path = require('path');

var moduleAdir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");

var dir = '/Users/kanghui/Projects/alipay-project2/arale2/switchable';
describe('node glob test', function() {
  it('test dir', function() {
    var files = glob.sync('**/*.js', {cwd: moduleAdir});
    files.should.have.length(9);

    var debugFiles = glob.sync('**/*-debug.js', {cwd: moduleAdir});
    debugFiles.should.have.length(2);

    var files = glob.sync('dist/templatable-debug.js', {cwd: path.join(moduleAdir)});
    files.should.have.length(1);
  });
});

