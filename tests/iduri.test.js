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
