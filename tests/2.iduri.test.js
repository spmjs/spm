var should = require('should');
var logging = require('colorful').logging;
var _require = require('./_require');
var iduri = _require('../lib/sdk/iduri');


describe('iduri.validate', function() {
  it('should be invalid error', function(done) {
    logging.once('logging-error', function() {
      done();
    });
    iduri.validate('//a').should.equal(false);
  });
  it('should invalid CMD warn', function(done) {
    logging.once('logging-warn', function(data) {
      data.should.include('CMD');
      done();
    });
    iduri.validate('abc').should.equal(false);
  });
  it('should be invalid CMD error', function(done) {
    logging.once('logging-error', function(data) {
      data.should.include('CMD');
      done();
    });
    iduri.validate('abc', {strict: true}).should.equal(false);
  });
});
