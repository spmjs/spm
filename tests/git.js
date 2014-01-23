var fs = require('fs');
var should = require('should');
var git = require('../lib/sdk/git');

describe('git', function() {
  it('get revision', function(done) {
    git.revision(function(err, stdout) {
      stdout.trim().length.should.equal(40);
      done();
    });
  });

  it('get remote', function(done) {
    git.remote(function(err, remote) {
      remote.should.contain('github.com');
      remote.should.contain('spmjs/spm.git');
      done();
    });
  });
});
