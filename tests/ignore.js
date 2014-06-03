require('should');
var tar = require('../lib/utils/tar');
var path = require('path');
var fs = require('fs');
var archive = require('ls-archive');

describe('ignore', function() {
  it('ignore field in package.spm', function(done) {
    tar.create(path.join(process.cwd(), 'tests', 'ignoreArray'),
               path.join(process.cwd(), 'tests', 'ignore-array.tar.gz'),
               function(error, target) {
      archive.list(target, function(err, files) {
        files = files.map(function(f) {
          return f.path;
        });
        files.indexOf('a/a.js').should.be.eql(-1);
        fs.unlinkSync(path.join(process.cwd(), 'tests', 'ignore-array.tar.gz'));
        done();
      });
    });
  });
});
