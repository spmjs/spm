var should = require('should');
var sinon = require('sinon');
var fs = require('fs');
var join = require('path').join;
var glob = require('glob');
var gulp = require('gulp');
var clean = require('gulp-clean');
var unzip = require('gulp-unzip');
var build = require('..').build;
var log = require('..').log;

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
      assets('build-css-all', dest);
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

  it('should handle path in windows', function(done) {
    var opt = {
      cwd: join(base, 'build-windows-path'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-windows-path', dest);
      done();
    });
  });

  it('should warn if package have multiple versions', function(done) {
    var opt = {
      cwd: join(base, 'build-multiple-versions'),
      dest: dest
    };
    var logWarn = sinon.spy(log, 'warn');
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-multiple-versions', dest);
      logWarn.callCount.should.be.equal(2);
      done();
    });
  });

  it('should install import-style if required', function(done) {
    var opt = {
      cwd: join(base, 'build-js-extdeps'),
      dest: dest
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-extdeps', dest);
      // resume package.json for next test
      fs.writeFileSync(
        join(opt.cwd, 'package.json'),
        '{"name":"a","version":"0.1.0"}\n',
        'utf-8'
      );
      done();
    });
  });

  it('should ignore with no deps', function(done) {
    var opt = {
      cwd: join(base, 'build-nodeps-ignore'),
      dest: dest,
      ignore: ['jquery']
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-nodeps-ignore', dest);
      done();
    });
  });

  it('js package with deps', function(done) {
    var opt = {
      cwd: join(base, 'build-js'),
      dest: dest,
      withDeps: true
    };
    build(opt, function(err) {
      should.not.exist(err);
      assets('build-js-with-deps', dest);
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
