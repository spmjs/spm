var path = require('path');
var should = require('should');
var require = require('./testutils');
var dependency = require('../lib/library/dependency');
var compiler = require('../lib/library/compiler');

describe('compiler.JSCompiler', function() {
  var JSCompiler = compiler.JSCompiler;
  it('can compile js with no dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'no-deps.js');
    var jsc = new JSCompiler(null, {filepath: file});
    jsc.compile(function(data) {
      data.should.include('[]');
      done();
    });
  });
  it('can compile js with a relative dependency', function(done) {
    var file = path.join(__dirname, 'data', 'one-relative-dep.js');
    var jsc = new JSCompiler(null, {filepath: file});
    jsc.compile(function(data) {
      data.should.include('["./no-deps"]');
      done();
    });
  });
  it('can compile js with a chain of relative dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'chain-dep4.js');
    var jsc = new JSCompiler(null, {filepath: file});
    jsc.compile(function(data) {
      var deps = dependency.parseDefine(data);
      deps.should.have.length(4);
      done();
    });
  });
  it('can compile js with a key-value dependency', function(done) {
    var file = path.join(__dirname, 'data', 'key-value-dep.js');
    var jsc = new JSCompiler(null, {
      filepath: file,
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
    jsc.compile(function(data) {
      data.should.include('["gallery/jquery/1.8.3/jquery"]');
      done();
    });
  });
  it('can compile js with key-value and chain relative dependencies', function() {
    var file = path.join(__dirname, 'data', 'chain-key-value-dep.js');
    var jsc = new JSCompiler(null, {
      filepath: file,
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
    var data = jsc.compile();
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
    var jsc = new JSCompiler(code);
    var data = jsc.compile();
    data.should.equal(code);
  });
});

describe('compiler.TplCompiler', function() {
  it('will transform tpl to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.tpl');
    var tplc = new compiler.TplCompiler(null, {filepath: file});
    var data = tplc.compile();
    data.should.include('"id"');

    tplc.compile(function(data) {
      data.should.include('"id"');
      done();
    });
  });
});

describe('compiler.CSSCompiler', function() {
  it('will transform css to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.css');
    var cssc = new compiler.CSSCompiler(null, {filepath: file});
    var data = cssc.compile();
    data.should.include('seajs.importStyle');

    cssc.compile(function(data) {
      data.should.include('seajs.importStyle');
      done();
    });
  });
});
