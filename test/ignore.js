var path = require('path');
var fs = require('fs');
var archive = require('ls-archive');
var tar = require('../lib/utils/tar');

describe('tar', function() {

  it('ignore field in package.spm', function(done) {
    tar.create(path.join(__dirname, './fixtures/tar-ignore'),
               path.join(__dirname, './fixtures/tar-ignore.tar.gz'),
               function(error, target) {
      archive.list(target, function(err, files) {
        files = files.map(function(f) {
          return f.path;
        });
        files.indexOf('a/a.js').should.be.eql(-1);
        fs.unlinkSync(path.join(__dirname, './fixtures/tar-ignore.tar.gz'));
        done();
      });
    });
  });
});
