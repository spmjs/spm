require('should');
var join = require('path').join;
var muk = require('muk');
var stdout = require('test-console').stdout;
var spmTest = require('../lib/test');

describe('test', function() {

  afterEach(muk.restore);

  it('should show testcase', function(done) {
    var inspect = stdout.inspect();
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        output.should.match(/should pass/);
        output.should.match(/ % Stmts |% Branches/);
        output.should.match(/ index.js    |       100 /);
        output.should.match(/ relative.js |       100 /);
      } catch(e) {
        err = e;
      }
      inspect.restore();
      done(err);
    });
  });

  it('should not show coverage', function(done) {
    var inspect = stdout.inspect();
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({nocoverage: true}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        output.should.match(/should pass/);
        output.should.not.match(/ % Stmts |% Branches/);
      } catch(e) {
        err = e;
      }
      inspect.restore();
      done(err);
    });
  });

  it('should show lcov with coveralls', function(done) {
    var inspect = stdout.inspect();
    muk(process, 'cwd', function() {
      return join(__dirname, 'fixtures/normal');
    });
    spmTest({coveralls: true}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        output.should.match(/should pass/);
        output.should.match(/ % Stmts |% Branches/);
        output.should.match(/SF:.*test\/fixtures\/normal\/index.js/);
        output.should.match(/BRDA:3,1,0,1/);
      } catch(e) {
        err = e;
      }
      inspect.restore();
      done(err);
    });
  });
});

