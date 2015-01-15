require('should');
var join = require('path').join;
var muk = require('muk');
var spmTest = require('../lib/test');

describe('test', function() {

  var write = process.stdout.write;
  var buffer = '';
  beforeEach(function() {
    process.stdout.write = function(buf) {
      buffer += buf;
      write.call(process.stdout, buf);
    };
  });
  afterEach(function() {
    buffer = '';
    process.stdout.write = write;
  });
  afterEach(muk.restore);

  it('should show testcase', function(done) {
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({}, function(err) {
      muk.restore();

      if (err) {
        return done(err);
      }
      try {
        buffer.should.match(/should pass/);
        buffer.should.match(/ % Stmts |% Branches/);
        buffer.should.match(/ index.js    |       100 /);
        buffer.should.match(/ relative.js |       100 /);
      } catch(e) {
        err = e;
      }
      done(err);
    });
  });

  it('should not show coverage', function(done) {
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({nocoverage: true}, function(err) {
      muk.restore();

      if (err) {
        return done(err);
      }
      try {
        buffer.should.match(/should pass/);
        buffer.should.not.match(/ % Stmts |% Branches/);
      } catch(e) {
        err = e;
      }
      done(err);
    });
  });

  it('should show lcov with coveralls', function(done) {
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({coveralls: true}, function(err) {
      muk.restore();

      if (err) {
        return done(err);
      }
      try {
        buffer.should.match(/should pass/);
        buffer.should.match(/ % Stmts |% Branches/);
        buffer.should.match(/SF:.*test\/fixtures\/normal\/index.js/);
        buffer.should.match(/BRDA:3,1,0,1/);
      } catch(e) {
        err = e;
      }
      done(err);
    });
  });
});

