var fs = require('fs');
var should = require('should');
var _require = require('./_require');
var spmrc = _require('../lib/sdk/spmrc');

describe('spmrc', function() {
  spmrc.spmrcfile = 'tmp/spmrc';

  it('get nothing', function() {
    spmrc.get().should.eql({});
  });

  it('set user.username = spm', function() {
    spmrc.set('user.username', 'spm');
  });

  it('get user.username', function() {
    spmrc.get('user.username').should.equal('spm');
  });

  it('get via config', function() {
    spmrc.config('user.username').should.equal('spm');
  });

  it('set via config', function() {
    spmrc.config('user.username', 'spmjs');
    spmrc.get('user.username').should.equal('spmjs');
  });

  it('set section:title.key', function() {
    spmrc.set('section:title.key', 'value');
    spmrc.get('section:title.key').should.equal('value');
    spmrc.get('section.title.key').should.equal('value');
  });

  it('set section.title.key', function() {
    spmrc.set('section.title.key', 'value2');
    spmrc.get('section:title.key').should.equal('value2');
    spmrc.get('section.title.key').should.equal('value2');
  });

  fs.unlink(spmrc.spmrcfile);
});
