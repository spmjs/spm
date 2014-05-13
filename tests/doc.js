require('should');
var sinon = require('sinon');
var doc = require('../lib/doc');
var nico = require('nico');
var spm = require('..');

describe('doc', function() {
  it('build', function() {
    nico.build = function() {};
    var nicoBuild = sinon.spy(nico, 'build');
    doc({
      build: true
    });
    nicoBuild.called.should.be.eql(true);
  });
  it('server', function() {
    nico.server = function() {};
    var server = sinon.spy(nico, 'server');
    doc({
      server: true
    });
    server.called.should.be.eql(true);
  });
  it('watch', function() {
    nico.server = function() {};
    var server = sinon.spy(nico, 'server');
    doc({
      watch: true
    });
    server.called.should.be.eql(true);
  });
  it('publish', function() {
    nico.build = function() {};
    spm.upload = function() {};
    var build = sinon.spy(nico, 'build');
    var upload = sinon.spy(spm, 'upload');
    doc({
      publish: true
    });
    build.called.should.be.eql(true);
    upload.called.should.be.eql(true);
  });
  it('callback', function() {
    var callback = sinon.spy();
    doc({
      build: true
    }, callback);
    callback.called.should.be.eql(true);
  });
});
