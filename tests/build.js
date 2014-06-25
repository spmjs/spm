var should = require('should');
var fs = require('fs');
var join = require('path').join;
var glob = require('glob');
var gulp = require('gulp');
var clean = require('gulp-clean');
var unzip = require('gulp-unzip');
var build = require('..').build;

describe('build', function() {
  var base = join(__dirname, 'build');
  var dest = join(base, 'dist');

  afterEach(function(done) {
    gulp.reset();
    gulp.removeAllListeners();
    gulp.src(dest)
      .pipe(clean({force: true}))
      .on('end', done)
      .resume();
  });

  it('js package', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js', dest);
      done();
    });
  });

  it('css package', function(done) {
    var opt = {
      cwd: join(base, 'build-css-package'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-css-package', dest);
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
      assets('build-js-all', dest);
      done();
    });
  });

  it('js package include all with ignore', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      include: 'all',
      ignore: ['b']
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-all-ignore', dest);
      done();
    });
  });

  it('js package include standalone', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      include: 'standalone'
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-standalone', dest);
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
      assets('build-css', dest);
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
      assets('build-css', dest);
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
      assets('build-js-other', dest);
      done();
    });
  });

  it('zip', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      zip: true,
    };
    build(opt, function(err) {
      should.not.exist(err);
      gulp.src(join(dest, 'archive.zip'))
        .pipe(unzip())
        .pipe(gulp.dest(join(dest, 'build-js')))
        .on('end', function() {
          assets('build-js', join(dest, 'build-js'));
          done();
        });
    });
  });

  it('should not clean directory', function(done) {
    var fakeFile = join(dest, 'a.js');
    fs.mkdirSync(dest);
    fs.writeFileSync(fakeFile);

    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      fs.existsSync(fakeFile).should.be.true;
      done();
    });
  });

  it('should clean directory', function(done) {
    var fakeFile = join(dest, 'a.js');
    fs.mkdirSync(dest);
    fs.writeFileSync(fakeFile);

    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      force: true
    };
    build(opt, function(err) {
      should.not.exist(err);
      fs.existsSync(fakeFile).should.be.false;
      done();
    });
  });

  it('should output png files', function(done) {
    var opt = {
      cwd: join(base, 'build-output-png'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-output-png', dest);
      done();
    });
  });

  it('can ignore when parse', function(done) {
    var opt = {
      cwd: join(base, 'ignore'),
      dest: dest,
      skip: ['crypto']
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('ignore', dest);
      done();
    });
  });

  function assets(prefix, dest) {
    var expect = join(base, 'expect', prefix);
    glob.sync('**/*', {cwd: expect})
      .filter(function(file) {
        return fs.statSync(join(expect, file)).isFile();
      })
      .forEach(function(file) {
        var expected = fs.readFileSync(join(expect, file))
          .toString().replace(/\n$/, '');
        var actual = fs.readFileSync(join(dest, file)).toString();
        actual.should.eql(expected);
      });
  }

});
