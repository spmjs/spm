require('should');
var join = require('path').join;
var stdout = require('test-console').stdout;
require('gnode');
var spmTest = require('../lib/test');

describe('test', function() {

  var oldCwd;

  beforeEach(function() {
    oldCwd = process.cwd();
    process.chdir(join(__dirname, 'fixtures/normal'));
  });

  afterEach(function() {
    process.chdir(oldCwd);
  });

  it('should show testcase', function(done) {
    var inspect = stdout.inspect();
    spmTest({}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        output.should.match(/should pass/);
        output.should.match(/You can see more detail in/);
      } catch(e) {
        err = e;
      }
      inspect.restore();
      done(err);
    });
  });

  it('should not show coverage', function(done) {
    var inspect = stdout.inspect();
    spmTest({nocoverage: true}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        output.should.match(/should pass/);
        output.should.not.match(/You can see more detail in/);
      } catch(e) {
        err = e;
      }
      inspect.restore();
      done(err);
    });
  });

  xit('should show lcov with coveralls', function(done) {
    var inspect = stdout.inspect();
    spmTest({coveralls: true}, function(err) {
      if (err) {
        return done(err);
      }
      try {
        var output = inspect.output.join('');
        console.log(output);
        output.should.match(/should pass/);
        output.should.match(/You can see more detail in/);
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

