var should = require('should');
var logging = require('colorful').logging;
var require = require('./_require');
var iduri = require('../lib/sdk/iduri');


describe('iduri.resolve', function() {
  var meta;

  it('has no version', function() {
    meta = iduri.resolve('lepture/nico');
    should.not.exist(meta.version);
  });

  it('has a version', function() {
    meta = iduri.resolve('lepture/nico@0.1.5');
    should.exist(meta.version);

    meta = iduri.resolve('lepture/nico#0.1.5');
    should.exist(meta.version);

    meta = iduri.resolve('lepture.nico@0.1.5');
    should.exist(meta.version);
  });

  it('should resolve as git', function() {
    meta = iduri.resolve('git@github.com:lepture/nico');
    meta.type.should.equal('git');

    meta = iduri.resolve('https://github.com/lepture/nico.git');
    meta.type.should.equal('git');

    meta = iduri.resolve('git+https://github.com/lepture/nico');
    meta.type.should.equal('git');
  });

  it('should resolve as http', function() {
    meta = iduri.resolve('https://github.com/lepture/nico');
    meta.type.should.equal('http');
  });

  it('should resolve as spm', function() {
    meta = iduri.resolve('lepture/nico');
    meta.type.should.equal('spm');

    meta = iduri.resolve('lepture.nico');
    meta.type.should.equal('spm');

    meta = iduri.resolve('seajs');
    meta.type.should.equal('spm');
  });

  it('has root: arale', function() {
    // git type
    meta = iduri.resolve('arale');
    meta.root.should.equal('arale');

    meta = iduri.resolve('arale/base');
    meta.root.should.equal('arale');

    meta = iduri.resolve('arale.base');
    meta.root.should.equal('arale');

    meta = iduri.resolve('git@github.com:aralejs/base');
    meta.root.should.equal('aralejs');

    meta = iduri.resolve('git://github.com/aralejs/base.git');
    meta.root.should.equal('aralejs');
  });
});

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

describe('iduri.pkg2id', function() {
  it('generate id without format config', function() {
    iduri.pkg2id({
      root: 'arale',
      name: 'class',
      version: '1.0.0',
      filename: 'class.js'
    }).should.equal('arale/class/1.0.0/class');
  });

  it('generate id with format config', function() {
    iduri.pkg2id({
      root: 'alice',
      filename: 'button.css'
    }, '<%= filename %>').should.equal('button.css');

    iduri.pkg2id({
      root: 'alice',
      filename: 'button.css'
    },'#<%= root %>/<%= filename %>').should.equal('#alice/button.css');
  });

  it('should generate id from relative path', function() {
    iduri.pkg2id({
      root: 'arale',
      name: 'base',
      version: '1.0.0',
      filename: 'class.js'
    }, './event.js').should.equal('./event');
  });
});

describe('iduri.alias2id', function() {
  it('should generate id from alias', function() {
    iduri.alias2id({
      alias: {
        'jquery': 'gallery/jquery/1.7.2/jquery'
      }
    }, 'jquery').should.equal('gallery/jquery/1.7.2/jquery');
  });
  it('should generate id from relative path', function() {
    iduri.alias2id({
      alias: {
        'jquery': 'gallery/jquery/1.7.2/jquery'
      }
    }, './events.js').should.equal('./events');
  });
});

describe('iduri.validate', function() {
  it('should be invalid error', function(done) {
    logging.once('logging-error', function(data) {
      done();
    });
    iduri.validate('//a').should.equal(false);
  });
  it('should invalid CMD warn', function(done) {
    logging.once('logging-warn', function(data) {
      data.should.include('CMD');
      done();
    });
    iduri.validate('abc').should.equal(false);
  });
  it('should be invalid CMD error', function(done) {
    logging.once('logging-error', function(data) {
      data.should.include('CMD');
      done();
    });
    iduri.validate('abc', {strict: true}).should.equal(false);
  });
});
