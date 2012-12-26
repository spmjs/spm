var should = require('should');
var require = require('./testutils');
var httplib = require('../lib/library/httplib');

describe('httplib.resolve', function() {
  it('has no version', function() {
    var meta = httplib.resolve('lepture/nico');
    should.not.exist(meta.version);
  });

  it('has a version', function() {
    var meta = httplib.resolve('lepture/nico@0.1.5');
    should.exist(meta.version);
  });

  it('should resolve as git', function() {
    var meta = httplib.resolve('lepture/nico');
    meta.type.should.equal('git');
    meta.url.should.equal('git@github.com:lepture/nico');

    meta = httplib.resolve('lepture/nico@0.1.5');
    meta.type.should.equal('git');
    meta.url.should.equal('git@github.com:lepture/nico');

    meta = httplib.resolve('git@github.com:lepture/nico');
    meta.type.should.equal('git');

    meta = httplib.resolve('https://github.com/lepture/nico.git');
    meta.type.should.equal('git');
  });

  it('should resolve as http', function() {
    var meta = httplib.resolve('https://github.com/lepture/nico');
    meta.type.should.equal('http');
  });

  it('should resolve as spm', function() {
    var meta = httplib.resolve('lepture.nico');
    meta.type.should.equal('spm');

    meta = httplib.resolve('lepture.nico@0.1.5');
    meta.type.should.equal('spm');

    meta = httplib.resolve('seajs');
    meta.type.should.equal('spm');
  });
});
