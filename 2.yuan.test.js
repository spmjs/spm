var should = require('should');
var sinon = require('sinon');
var require = require('./_require');
var yuan = require('../lib/sdk/yuan');

describe('yuan.login', function() {
  it('can log in yuan', function() {
    var service = new yuan.Yuan({username: 'spm', password: 'spm'});
    sinon.stub(service, 'request');
    service.login(sinon.spy());
  });
});
