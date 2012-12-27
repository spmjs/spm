var should = require('should');
var require = require('./testutils');
var httplib = require('../lib/library/httplib');

describe('httplib.resolve', function() {
  var meta;

  it('has no version', function() {
    meta = httplib.resolve('lepture/nico');
    should.not.exist(meta.version);
  });

  it('has a version', function() {
    meta = httplib.resolve('lepture/nico@0.1.5');
    should.exist(meta.version);

    meta = httplib.resolve('lepture/nico#0.1.5');
    should.exist(meta.version);

    meta = httplib.resolve('lepture.nico@0.1.5');
    should.exist(meta.version);
  });

  it('should resolve as git', function() {
    meta = httplib.resolve('lepture/nico');
    meta.type.should.equal('git');

    meta = httplib.resolve('git@github.com:lepture/nico');
    meta.type.should.equal('git');

    meta = httplib.resolve('https://github.com/lepture/nico.git');
    meta.type.should.equal('git');

    meta = httplib.resolve('git+https://github.com/lepture/nico');
    meta.type.should.equal('git');
  });

  it('should resolve as http', function() {
    meta = httplib.resolve('https://github.com/lepture/nico');
    meta.type.should.equal('http');
  });

  it('should resolve as spm', function() {
    meta = httplib.resolve('lepture.nico');
    meta.type.should.equal('spm');

    meta = httplib.resolve('seajs');
    meta.type.should.equal('spm');
  });

  it('has root: arale', function() {
    // git type
    meta = httplib.resolve('arale');
    meta.root.should.equal('arale');

    meta = httplib.resolve('arale/base');
    meta.root.should.equal('arale');

    meta = httplib.resolve('arale.base');
    meta.root.should.equal('arale');

    meta = httplib.resolve('git@github.com:aralejs/base');
    meta.root.should.equal('aralejs');

    meta = httplib.resolve('git://github.com/aralejs/base.git');
    meta.root.should.equal('aralejs');
  });
});
