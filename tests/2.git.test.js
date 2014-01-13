var fs = require('fs');
var should = require('should');
var _require = require('./_require');
var git = _require('../lib/sdk/git');

describe('git', function() {
  it('get revision', function(done) {
    git.revision(function(err, stdout) {
      stdout.trim().length.should.equal(40);
      done();
    });
  });

  it('get remote', function(done) {
    git.remote(function(err, remote) {
      remote.should.equal('git@github.com:spmjs/spm.git');
      done();
    });
  });
});
