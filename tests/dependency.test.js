var require = require('./testutils');
var dep = require('../lib/library/dependency');

describe('find define dependencies', function() {
  it('find ./a as dependency', function() {
    var code = [
      "define('id', ['./a'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    dep.parseDefine(code).should.includeEql('./a');
  });

  it('find b as dependency', function() {
    var code = [
      "define(['b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    dep.parseDefine(code).should.includeEql('b');
  });

  it('find a, b as dependencies', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    dep.parseDefine(code).should.eql(['a', 'b']);
  });

  it('find both two define dependencies', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})",
      "define('id2', ['c', 'd'], function(require, exports, module) {",
      "})"
    ].join('\n');
    dep.parseDefine(code).should.eql(['a', 'b', 'c', 'd']);
  });

  it('should not find the define in define', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "  define('id2', ['c', 'd'], function(require, exports, module) {",
      "  })",
      "})"
    ].join('\n');
    dep.parseDefine(code).should.eql(['a', 'b']);
  });
});


describe('find require dependencies', function() {
  it('find jquery as dependency', function() {
    var code = [
      "define('id', ['./a'], function(require, exports, module) {",
      "  var jquery = require('jquery');",
      "})"
    ].join('\n');
    dep.parseRequire(code).should.includeEql('jquery');
  });

  it('find jquery, moment as dependencies', function() {
    var code = [
      "define(['b'], function(require, exports, module) {",
      "  var jquery = require('jquery-ui');",
      "  var moment = require('moment');",
      "})"
    ].join('\n');
    dep.parseRequire(code).should.eql(['jquery-ui', 'moment']);
  });

  it('find nothing as dependency', function() {
    var code = [
      "define('id', ['a', 'b'], function(require, exports, module) {",
      "  var jquery = module.require('jquery');",
      "})"
    ].join('\n');
    dep.parseRequire(code).should.have.length(0);
  });
});
