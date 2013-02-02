var path = require('path');
var should = require('should');
var _require = require('./_require');
var module = _require('../lib/sdk/module');

var datadir = path.join(__dirname, 'module-cases');

describe('module.srcDependencies', function() {
  var pkg = path.join(datadir, 'package.json');

  it('get no dependencies', function() {
    var deps = module.srcDependencies(path.join(datadir, 'none-src'), pkg);
    deps.should.eql({});
  });
  it('get one dependency', function() {
    var deps = module.srcDependencies(path.join(datadir, 'one-src'), pkg);
    deps.should.eql({'gallery/jquery': ['1.7.2']});
  });
  it('get multi dependencies', function() {
    var deps = module.srcDependencies(path.join(datadir, 'multi-src'), pkg);
    deps.should.eql({
      'gallery/jquery': ['1.7.2'],
      'arale/widget': ['0.9.1']
    });
  });
  it('get multi versions', function() {
    var deps = module.srcDependencies(path.join(datadir, 'versions-src'), pkg);
    deps.should.eql({
      'arale/widget': ['0.9.1', '0.9.2']
    });
  });
});

describe('module.distDependencies', function() {
  it('get one dependency', function() {
    var deps = module.distDependencies(path.join(datadir, 'one-dist'));
    deps.should.eql({'gallery/jquery': ['1.7.2']});
  });
  it('get multi dependency', function() {
    var deps = module.distDependencies(path.join(datadir, 'multi-dist'));
    deps.should.eql({
      'gallery/jquery': ['1.7.2'],
      'arale/widget': ['0.9.1']
    });
  });
});
