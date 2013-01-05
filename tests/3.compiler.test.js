var path = require('path');
var should = require('should');
var require = require('./testutils');
var dependency = require('../lib/library/dependency');
var _compiler = require('../lib/library/compiler');

describe('compiler.JSCompiler', function() {
  var JSCompiler = _compiler.JSCompiler;
  it('can compile js with no dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'no-deps.js');
    var compiler = new JSCompiler(null, {filepath: file});
    compiler.run(function(data) {
      data.should.include('[]');
      done();
    });
  });
  it('can compile js with a relative dependency', function(done) {
    var file = path.join(__dirname, 'data', 'one-relative-dep.js');
    var compiler = new JSCompiler(null, {filepath: file});
    compiler.run(function(data) {
      data.should.include('["./no-deps"]');
      done();
    });
  });
  it('can compile js with a chain of relative dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'chain-dep4.js');
    var compiler = new JSCompiler(null, {filepath: file});
    compiler.run(function(data) {
      var deps = dependency.parseDefine(data);
      deps.should.have.length(4);
      done();
    });
  });
  it('can compile js with a key-value dependency', function(done) {
    var file = path.join(__dirname, 'data', 'key-value-dep.js');
    var compiler = new JSCompiler(null, {
      filepath: file,
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
    compiler.run(function(data) {
      data.should.include('["gallery/jquery/1.8.3/jquery"]');
      done();
    });
  });
  it('can compile js with key-value and chain relative dependencies', function() {
    var file = path.join(__dirname, 'data', 'chain-key-value-dep.js');
    var compiler = new JSCompiler(null, {
      filepath: file,
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
    var data = compiler.run();
    var deps = dependency.parseDefine(data);
    deps.should.include('gallery/jquery/1.8.3/jquery');
    deps.should.include('./chain-dep0');
  });
  it('will do nothing if user defined dependencies', function() {
    var code = [
      "define('id', ['a'], function(require) {",
        "require('jquery');",
      "})"
    ].join('\n');
    var compiler = new JSCompiler(code);
    var data = compiler.run();
    data.should.equal(code);
  });
});

describe('compiler.TplCompiler', function() {
  it('will transform tpl to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.tpl');
    var compiler = new _compiler.TplCompiler(null, {filepath: file});
    var data = compiler.run();
    data.should.include('"id"');

    compiler.run(function(data) {
      data.should.include('"id"');
      done();
    });
  });
});

describe('compiler.CSSCompiler', function() {
  it('will transform css to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.css');
    var compiler = new _compiler.CSSCompiler(null, {filepath: file});
    var data = compiler.run();
    data.should.include('seajs.importStyle');

    compiler.run(function(data) {
      data.should.include('seajs.importStyle');
      done();
    });
  });
});
