var should = require('should');
var require = require('./testutils');
var ast = require('../lib/library/ast');

describe('ast.parseDefines', function() {
  it('find ./a as dependency', function() {
    var code = [
      "define('id', ['./a'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    var parsed = ast.parseDefines(code)[0];
    parsed.id.should.equal('id');
    parsed.dependencies.should.includeEql('./a');
  });

  it('find b as dependency', function() {
    var code = [
      "define(['b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    var parsed = ast.parseDefines(code)[0];
    parsed.dependencies.should.includeEql('b');
  });

  it('find a, b as dependencies', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    var parsed = ast.parseDefines(code)[0];
    parsed.id.should.equal('id');
    parsed.dependencies.should.eql(['a', 'b']);
  });

  it('find both two define dependencies', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})",
      "define('id2', ['c', 'd'], function(require, exports, module) {",
      "})"
    ].join('\n');
    var parsed = ast.parseDefines(code);
    parsed.should.have.length(2);
    var deps = [];
    parsed.forEach(function(ret) {
      ret.dependencies.forEach(function(dep) {
        deps.push(dep);
      });
    });
    deps.should.eql(['a', 'b', 'c', 'd']);
  });

  it('should not find the define in define', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "  define('id2', ['c', 'd'], function(require, exports, module) {",
      "  })",
      "})"
    ].join('\n');
    var parsed = ast.parseDefines(code)[0];
    parsed.id.should.equal('id');
    parsed.dependencies.should.eql(['a', 'b']);
  });

  it('should have factory {}', function() {
    var parsed = ast.parseDefines('define({})')[0];
    should.exists(parsed.factory);
  });
});


describe('ast.getRequires', function() {
  it('find jquery as dependency', function() {
    var code = [
      "define('id', ['./a'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    ast.getRequires(code).should.includeEql('jquery');
  });

  it('find jquery, moment as dependencies', function() {
    var code = [
      "define(['b'], function(require, exports, module) {",
      "  var jquery = require('jquery-ui');",
      "  var moment = require('moment');",
      "})"
    ].join('\n');
    ast.getRequires(code).should.eql(['jquery-ui', 'moment']);
  });

  it('has id, but no dependencies', function() {
    var code = [
      "define('id', function(require, exports, module) {",
      "  var jquery = require('jquery-ui');",
      "  var moment = require('moment');",
      "})"
    ].join('\n');
    ast.parseDefines(code)[0].id.should.equal('id');
    ast.getRequires(code).should.eql(['jquery-ui', 'moment']);
  });


  it('find nothing as dependency', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = module.require('jquery');",
      "})"
    ].join('\n');
    ast.getRequires(code).should.have.length(0);
  });
});

describe('ast.replaceRequire', function() {
  it('can replace jquery and underscore', function() {
    var code = [
      "define(function(require) {",
      "  var jquery = require('jquery');",
      "  var undersocre = require('undersocre');",
      "})"
    ].join('\n');
    code = ast.replaceRequire(code, function(value) {
      return {jquery: '$', undersocre: '_'}[value];
    });
    code.should.include('require("$")');
    code.should.include('require("_")');
  });
});

describe('ast.replaceDefine', function() {
  it('replace id and dependencies', function() {
    var code = "define({})";
    code = ast.replaceDefine(code, 'id', ['a']);
    code.should.equal('define("id", ["a"], {})');
  });

  it('will not replace define', function() {
    var code = "define({}); define({})";
    ast.replaceDefine(code, 'id', ['a']).should.not.include('id');
  });
});

describe('ast.replaceAll', function() {
  it('should be debug id', function() {
    var code = "define('id', [], {})";
    ast.replaceAll(code, function(v) {
      return v + '-debug';
    }).should.include('id-debug');
  });

  it('should be debug require', function() {
    var code = "define(function(require){ require('jquery') })";

    ast.replaceAll(code, function(v) {
      return v + '-debug';
    }).should.include('jquery-debug');
  });

  it('should be debug dependencies', function() {
    var code = "define('id', ['jquery'], {})";

    ast.replaceAll(code, function(v) {
      return v + '-debug';
    }).should.include('jquery-debug');
  });

  it('should have id-debug, jquery-debug', function() {
    var code = "define('id', [], function(require){ require('jquery') })";

    var data = ast.replaceAll(code, function(v) {
      return v + '-debug';
    });
    data.should.include('id-debug');
    data.should.include('jquery-debug');
  });
});
