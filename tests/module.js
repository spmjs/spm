require('should');
var parseDependencies = require('../lib/sdk/module').parseDependencies;


describe('module', function() {
  it('parseDependencies', function() {
    var result = parseDependencies({
      a: '1-1',
      b: 'abc',
      c: undefined,
      e: null
    });
    result.should.eql(['a@1-1', 'b@abc', 'c@undefined', 'e@null']);
  });
});
