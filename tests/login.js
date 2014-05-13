require('should');
var sinon = require('sinon');
var yuan = require('../lib/sdk/yuan');

describe('yuan.login', function() {
  it('can log in yuan', function() {
    var service = yuan();
    var stub = sinon.stub(service, 'request');
    service.login({username: 'spm', authkey: 'spm'}, function() {});
    stub.callCount.should.eql(1);
  });
});
