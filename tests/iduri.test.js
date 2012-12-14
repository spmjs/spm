var should = require('should');
var require = require('./testutils');
var iduri = require('../lib/library/iduri');

describe('iduri.normalize', function() {
  it('return a/c', function() {
    iduri.normalize('a//b/../c').should.equal('a/c');
  });
});

describe('iduri.resolve', function() {
});

describe('iduri.relative', function() {
});

describe('iduri.join', function() {
});

describe('iduri.basename', function() {
});

describe('iduri.extname', function() {
});
