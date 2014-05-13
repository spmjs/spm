require('should');
var file = require('../lib/sdk/file');

describe('file', function() {
  it('isroot', function() {
    file.isroot('/').should.eql(true);
    var oldPlatform = process.platform;
    process.platform = 'win32';
    file.isroot('C:\\').should.eql(true);
    file.isroot('D:\\').should.eql(true);
    process.platform = oldPlatform;
  });

  it('abspath & exists', function() {
    file.exists(file.abspath('file.js')).should.eql(false);
    file.exists(file.abspath('tests/file.js')).should.eql(true);
  });

  it('cleanpath', function() {
    file.cleanpath(process.cwd() + '/tests/file.js').should.eql('tests/file.js');
    file.cleanpath(process.cwd() + '/xxx.js').should.eql('xxx.js');
  });

  it('contain', function() {
    file.contain(process.cwd(), process.cwd() + '/tests/file.js').should.eql(true);
  });

  it('mkdir & rmdir', function() {
    file.mkdir('tests/files');
    file.exists('tests/files').should.eql(true);
    file.rmdir('tests/files');
    file.exists('tests/files').should.eql(false);
  });

  it('copy', function() {
    file.copy('tests/file.js', 'tests/copyed');
    file.exists('tests/copyed').should.eql(true);
    require('fs').unlinkSync('tests/copyed');
  });

});
