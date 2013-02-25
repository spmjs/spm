var should = require('should');
var sinon = require('sinon');
var _require = require('./_require');
var yuan = _require('../lib/sdk/yuan');

describe('yuan.login', function() {
  it('can log in yuan', function() {
    var service = yuan();
    sinon.stub(service, 'request');
    service.login({username: 'spm', password: 'spm'}, sinon.spy());
  });
});
