var should = require('should');
var module = require('../lib/sdk/module');


describe('module', function() {
  it('parseDependencies', function() {
    var result = module.parseDependencies({
      a: '1-1',
      b: 'abc',
      c: undefined,
      e: null
    });
    result.should.eql(['a@1-1', 'b@abc', 'c@undefined', 'e@null']);
  });
});
