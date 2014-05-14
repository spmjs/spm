var should = require('should');
var fs = require('fs');
var join = require('path').join;
var glob = require('glob');
var gulp = require('gulp');
var clean = require('gulp-clean');
var build = require('..').build;

describe('build', function() {
  var base = join(__dirname, 'build');
  var dest = join(base, 'dist');

  afterEach(function(done) {
    gulp.src(dest)
      .pipe(clean({force: true}))
      .on('end', done);
  });

  it('js package', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js');
      done();
    });
  });

  it('js package include all', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      include: 'all'
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-all');
      done();
    });
  });

  it('js require css', function(done) {
    var opt = {
      cwd: join(base, 'build-css'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-css');
      done();
    });
  });

  it('js require css include all', function(done) {
    var opt = {
      cwd: join(base, 'build-css'),
      dest: dest,
      include: 'all'
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-css');
      done();
    });
  });

  it('js require other type', function(done) {
    var opt = {
      cwd: join(base, 'build-js-other'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-other');
      done();
    });
  });

  function assets(prefix) {
    var expect = join(base, 'expect', prefix);
    glob.sync('**/*', {cwd: dest})
      .forEach(function(file) {
        fs.readFileSync(join(expect, file)).toString()
          .should.include(fs.readFileSync(join(dest, file)).toString());
      });
  }

});
