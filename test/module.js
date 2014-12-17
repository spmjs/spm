var mo = require('../lib/sdk/module');
var join = require('path').join;

describe('module', function() {
  it('getSourceFiles', function() {
    var list = mo.getSourceFiles(join(__dirname, './fixtures/normal'));
    list.should.be.eql(['index', 'relative']);
  });

  it('getDependencies', function() {
    var deps = mo.getDependencies(join(__dirname, './fixtures/normal'));
    deps.should.be.eql({
      b: 'b/0.1.0/index.js'
    });
  });
});
