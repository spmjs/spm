var mo = require('../lib/sdk/module');
var join = require('path').join;

describe('module', function() {
  it('getSourceFiles', function() {
    var list = mo.getSourceFiles(join(__dirname, './fixtures/normal'));
    list.should.be.eql(['index', 'relative']);
  });
});
