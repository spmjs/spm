var sinon = require('sinon');
var doc = require('../lib/doc');
var nico = require('nico-spm');
var muk = require('muk');

describe('doc', function() {

  var build, server;
  beforeEach(function() {
    build = sinon.stub(nico, 'build', function() {});
    server = sinon.stub(nico, 'server', function() {});
  });
  afterEach(function() {
    build.restore();
    server.restore();
  });

  it('build', function() {
    doc({
      build: true
    });
    build.called.should.be.eql(true);
  });

  it('watch', function() {
    doc({
      watch: true
    });
    server.called.should.be.eql(true);
  });

  it('publish', function() {
    var mockUpload = {
      './upload': function() {}
    };
    var upload = sinon.spy(mockUpload, './upload');
    var doc = muk('../lib/doc', mockUpload);
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
