var fs = require('fs');
var path = require('path');
var should = require('should');
var require = require('./testutils');
var dependency = require('../lib/library/dependency');
var compiler = require('../lib/library/compiler');

var datadir = path.join(__dirname, 'data');

describe('compiler.JSCompiler', function() {
  var JSCompiler = compiler.JSCompiler;
  it('can compile js with no dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'no-deps.js');
    var jsc = new JSCompiler(file);
    jsc.compile(function(data) {
      data.should.include('[]');
      done();
    });
  });
  it('can compile js with a relative dependency', function(done) {
    var file = path.join(__dirname, 'data', 'one-relative-dep.js');
    var jsc = new JSCompiler(file);
    jsc.compile(function(data) {
      data.should.include('["./no-deps"]');
      done();
    });
  });
  it('can compile js with a chain of relative dependencies', function(done) {
    var file = path.join(__dirname, 'data', 'chain-dep4.js');
    var jsc = new JSCompiler(file);
    jsc.compile(function(data) {
      var deps = dependency.parseDefine(data);
      deps.should.have.length(4);
      done();
    });
  });
  it('can compile js with a key-value dependency', function(done) {
    var file = path.join(__dirname, 'data', 'key-value-dep.js');
    var jsc = new JSCompiler(file, {
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
    var jsc = new JSCompiler(file, {
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
    var file = path.join(__dirname, 'data', 'defined-deps.js');
    var jsc = new JSCompiler(file);
    var data = jsc.compile();
    data.should.equal(fs.readFileSync(file, 'utf8'));
  });
  it('will write file to .spm-build', function(done) {
    var file = path.join(datadir, 'no-deps.js');
    var jsc = new JSCompiler(file, {inputDirectory: datadir});
    jsc.run(function(err) {
      if (err) throw err;
      fs.existsSync(path.join('.spm-build', 'no-deps.js')).should.equal(true);
      done();
    });
  });
});

describe('compiler.JtplCompiler', function() {
  it('will transform tpl to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.tpl');
    var jtpl = new compiler.JtplCompiler(file);
    var data = jtpl.compile();
    data.should.include('"id"');

    jtpl.compile(function(data) {
      data.should.include('"id"');
      done();
    });
  });

  it('will write file to .spm-build', function(done) {
    var file = path.join(datadir, 'simple.tpl');
    var jtpl = new compiler.JtplCompiler(file, {inputDirectory: datadir});
    jtpl.run(function(err) {
      if (err) throw err;
      fs.existsSync(path.join('.spm-build', 'simple.tpl.js')).should.equal(true);
      done();
    });
  });
});

describe('compiler.JCSSCompiler', function() {
  it('will transform css to js', function(done) {
    var file = path.join(__dirname, 'data', 'simple.css');
    var jcss = new compiler.JCSSCompiler(file);
    var data = jcss.compile();
    data.should.include('seajs.importStyle');

    jcss.compile(function(data) {
      data.should.include('seajs.importStyle');
      done();
    });
  });

  it('will write file to .spm-build', function(done) {
    var file = path.join(datadir, 'simple.css');
    var jtpl = new compiler.JCSSCompiler(file, {inputDirectory: datadir});
    jtpl.run(function(err) {
      if (err) throw err;
      fs.existsSync(path.join('.spm-build', 'simple.css.js')).should.equal(true);
      done();
    });
  });
});
