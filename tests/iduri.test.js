var should = require('should');
var require = require('./testutils');
var iduri = require('../lib/library/iduri');

describe('iduri.normalize', function() {
  it('return a/c', function() {
    iduri.normalize('a//b/../c').should.equal('a/c');
  });
});

describe('iduri.relative', function() {
});

describe('iduri.join', function() {
});

describe('iduri.basename', function() {
});

describe('iduri.extname', function() {
});

describe('iduri.generateId', function() {
  it('generate id without format config', function() {
    iduri.generateId({
      root: 'arale',
      name: 'class',
      version: '1.0.0',
      filename: 'class.js'
    }).should.equal('arale/class/1.0.0/class');
  });

  it('generate id with format config', function() {
    iduri.generateId({
      format: '{{filename}}',
      root: 'alice',
      filename: 'button.css'
    }).should.equal('button.css');

    iduri.generateId({
      format: '#{{root}}/{{filename}}',
      root: 'alice',
      filename: 'button.css'
    }).should.equal('#alice/button.css');
  });
});

describe('iduri.name2id', function() {
  it('should generate id from relative path', function() {
    iduri.name2id({
      root: 'arale',
      name: 'base',
      version: '1.0.0',
      filename: 'class.js'
    }, './event.js').should.equal('arale/base/1.0.0/event');
  });

  it('should generate id from dependencies', function() {
    iduri.name2id({
      dependencies: {
        'jquery': 'gallery/jquery/1.7.2/jquery'
      }
    }, 'jquery').should.equal('gallery/jquery/1.7.2/jquery');
  });

  it('should generate id from nothing', function() {
    iduri.name2id({}, 'hello').should.equal('hello');
  });
});
