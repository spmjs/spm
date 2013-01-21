var path = require('path');
var should = require('should');
var require = require('./_require');
var dependency = require('../lib/sdk/dependency');

var datadir = path.join(__dirname, 'data');

describe('dependency.parse', function() {
  it('get no dependencies', function() {
    var file = path.join(datadir, 'no-deps.js');
    var deps = dependency.parse(file);
    deps.should.have.length(0);
  });
  it('get a relative dependency', function() {
    var file = path.join(datadir, 'one-relative-dep.js');
    var deps = dependency.parse(file);
    deps.should.have.length(1);
    deps.should.include('./no-deps');
  });
  it('get a chain of relative dependencies', function() {
    var file = path.join(datadir, 'chain-dep4.js');
    var deps = dependency.parse(file);
    deps.should.have.length(4);
  });
});
