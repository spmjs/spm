var join = require('path').join;
var proc = require('child_process');
var fs = require('fs');
var readFile = require('fs').readFileSync;
var writeFile = require('fs').writeFileSync;
var exist = require('fs').existsSync;
var rmrf = require('rimraf').sync;

describe('cli', function() {

  describe('install', function() {

    afterEach(function() {
      rm('install/spm_modules');
      writeFile(path('install/package.json'), JSON.stringify({
        name: 'a',
        version: '0.1.0',
        spm: {}
      }), 'utf-8');
    });

    it('normal', function(done) {
      exec('spm install type --no-color', 'install', function(err, out) {
        if (out.error) throw out.error;
        out.stdout.should.containEql('install:');
        out.stdout.should.containEql('installed:');
        exists('install/spm_modules').should.be.true;
        done();
      });
    });

    it('force', function(done) {
      exec('spm install type --force --no-color', 'install', function(err, out) {
        if (out.error) throw out.error;
        out.stdout.should.containEql('install:');
        out.stdout.should.containEql('download:');
        out.stdout.should.containEql('installed:');
        exists('install/spm_modules').should.be.true;
        done();
      });
    });

    it('save', function(done) {
      exec('spm install type --force --save', 'install', function(err, out) {
        if (out.error) throw out.error;
        pkg('install').spm.dependencies.type.should.be.ok;
        done();
      });
    });

    it('save dev', function(done) {
      exec('spm install type --force --save-dev', 'install', function(err, out) {
        if (out.error) throw out.error;
        (pkg('install').spm.dependencies === undefined).should.be.true;
        pkg('install').spm.devDependencies.type.should.be.ok;
        done();
      });
    });

    it('save dev alias', function(done) {
      exec('spm install type --force -SD', 'install', function(err, out) {
        if (out.error) throw out.error;
        (pkg('install').spm.dependencies === undefined).should.be.true;
        pkg('install').spm.devDependencies.type.should.be.ok;
        done();
      });
    });
  });
});

function pkg(fixture) {
  fixture = path(fixture + '/package.json');
  return JSON.parse(readFile(fixture));
}

function rm(fixture) {
  fixture = path(fixture);
  rmrf(fixture);
}

function path(fixture) {
  return join.apply(null, [__dirname, 'fixtures'].concat(fixture.split('/')));
}

function exists(file) {
  return exist(path(file));
}

function exec(cmd, cwd, done) {
  cmd = join(__dirname, '..', 'bin', cmd);
  cwd = join(__dirname, 'fixtures', cwd);
  execute(cmd, {cwd:cwd}, done);
}

function execute(cmd, opts, done) {
  proc.exec(cmd, opts, function(err, stdout, stderr) {
    done(null, {
      error: err,
      stdout: stdout,
      stderr: stderr
    });
  })
}
