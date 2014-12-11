var should = require('should');
var iduri = require('../lib/sdk/iduri');

describe('iduri', function() {
  it('name@1.0.0', function() {
     var data = iduri.resolve('name@1.0.0');
     data.name.should.eql('name');
     data.version.should.eql('1.0.0');
  });
  it('name@', function() {
    var data = iduri.resolve('name@');
    should.not.exist(data);
  });
  it('name@xxx', function() {
    var data = iduri.resolve('name@xxx');
    data.name.should.eql('name');
    data.version.should.eql('xxx');
  });
  it('name', function() {
    var data = iduri.resolve('name');
    data.name.should.eql('name');
    data.version.should.eql('');
  });
  it('name.suffix', function() {
    var data = iduri.resolve('name.suffix');
    data.name.should.eql('name.suffix');
    data.version.should.eql('');
  });
  it('name.suffix@1.0.0', function() {
    var data = iduri.resolve('name.suffix@1.0.0');
    data.name.should.eql('name.suffix');
    data.version.should.eql('1.0.0');
  });
  it('prefix/name@1.0.0', function() {
    var data = iduri.resolve('prefix/name@1.0.0');
    should.not.exist(data);
  });
  it('prefix-name@1.0.0', function() {
    var data = iduri.resolve('prefix-name@1.0.0');
    data.name.should.eql('prefix-name');
    data.version.should.eql('1.0.0');
  });
  it('prefix_name@1.0.0', function() {
    var data = iduri.resolve('prefix_name@1.0.0');
    should.not.exist(data);
  });
  it('prefixName@0.0.1', function() {
    var data = iduri.resolve('prefixName@0.0.1');
    data.name.should.eql('prefixname');
    data.version.should.eql('0.0.1');
  });
});

