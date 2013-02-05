var should = require('should');
var _require = require('./_require');
var iduri = _require('../lib/sdk/iduri');


describe('iduri.validate', function() {
  it('should be invalid error', function() {
    iduri.validate('//a').should.equal(false);
  });
  it('should invalid CMD warn', function() {
    iduri.validate('abc').should.equal(false);
  });
  it('should be invalid CMD error', function() {
    iduri.validate('abc', {strict: true}).should.equal(false);
  });
});
