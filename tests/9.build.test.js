var path = require('path');
var should = require('should');
var require = require('./testutils');
var dependency = require('../lib/library/dependency');
var build = require('../lib/builtin/build');

describe('build.compileJS', function() {
  it('can compile js with no dependencies', function() {
    var file = path.join(__dirname, 'data', 'no-deps.js');
    var data = build.compileJS(null, file);
    data.should.include('[]');
  });
  it('can compile js with a relative dependency', function() {
    var file = path.join(__dirname, 'data', 'one-relative-dep.js');
    var data = build.compileJS(null, file);
    data.should.include('["./no-deps"]');
  });
  it('can compile js with a chain of relative dependencies', function() {
    var file = path.join(__dirname, 'data', 'chain-dep4.js');
    var data = build.compileJS(null, file);
    var deps = dependency.parseDefine(data);
    deps.should.have.length(4);
  });
  it('can compile js with a key-value dependency', function() {
    var file = path.join(__dirname, 'data', 'key-value-dep.js');
    var data = build.compileJS(null, file, {
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
    data.should.include('["gallery/jquery/1.8.3/jquery"]');
  });
  it('can compile js with key-value and chain relative dependencies', function() {
    var file = path.join(__dirname, 'data', 'chain-key-value-dep.js');
    var data = build.compileJS(null, file, {
      dependencies: {
        jquery: "gallery/jquery/1.8.3/jquery"
      }
    });
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
    var data = build.compileJS(code, 'defined-deps.js');
    data.should.equal(code);
  });
});

describe('build.compileTPL', function() {
  it('will transform tpl to js', function() {
    var file = path.join(__dirname, 'data', 'simple.tpl');
    var data = build.compileTPL(null, file);
    data.should.include('"id"');
  });
});

describe('build.compileCSS', function() {
  it('will transform css to js', function() {
    var file = path.join(__dirname, 'data', 'simple.css');
    var data = build.compileCSS(null, file);
    data.should.include('seajs.importStyle');
  });
});
