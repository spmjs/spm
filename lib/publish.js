/* publish modules to spmjs.org */

var fs = require('fs');
var path = require('path');
var commander = require('commander');
var format = require('util').format;
var semver = require('semver');
var color = require('colorful').color;
var tar = require('./utils/tar');
var log = require('./utils/log');
var childexec = require('./utils').childexec;
var grunt = require('./sdk/grunt');
var _module = require('./sdk/module');
var yuan = require('./sdk/yuan');
var spmrc = require('./config');


module.exports = function(options, callback) {
  login(options, function(err, auth) {
    if (err) {
      log.error('exit', err);
      process.exit();
    }
    options.auth = auth;
    upload(options, function(err, res, body) {
      if (err) {
        log.error('exit', err);
        process.exit(1);
      } else if (!(res.statusCode === 200 || res.statusCode === 201)) {
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
        log[body.status](body.status, body.message);
      } else {
        log.info('success', 'package is published.');
      }
      callback(null, body);
    });
  });
};


function login(options, callback) {
  if (options.username && options.password) {
    yuan(options).login(options, callback);
    return;
  }
  var auth, section;
  if (options.source) {
    section = 'source.' + options.source + '.auth';
  } else {
    section = 'user.auth';
  }
  auth = spmrc.config(section);
  if (auth) return callback(null, auth);

  var username = spmrc.config('user.username');
  var text;
  if (username) {
    text = format('username(%s): ', username);
  } else {
    text = format('username: ');
  }
  commander.prompt(text, function(account) {
    if (!account && username) account = username;

    commander.password('password: ', function(password) {
      options.account = account;
      options.password = password;
      yuan(options).login(options, callback);
    });
  });
}

function upload(options, callback) {
  var pkg = grunt.file.readJSON('package.json');

  var name = pkg.family + '/' + pkg.name + (pkg.version ? '@' + pkg.version : '');
  if (options.tag) {
    name += ' ~ ' + options.tag;
  }
  log.info('publish', color.magenta(name));

  var _upload = function(pkg) {
    // verify package.json
    if (!verifyPackage(pkg)) {
      process.exit(1);
    }
    var readme = getReadme();
    if (readme) {
      pkg.readme = readme;
    } else {
      pkg.warn('verify', 'readme not found.');
    }
    if (options.tag) {
      pkg.tag = options.tag;
    } else {
      pkg.tag = 'stable';
    }
    pkg.dependencies = _module.plainDependencies(_module.distDependencies());
    pkg.distfiles = [];
    grunt.file.recurse('dist', function(fpath) {
      pkg.distfiles.push(fpath.replace(/^dist\//, ''));
    });

    getTarfile(pkg, function(err, target) {
      options.tarfile = target;
      yuan(options).publish(pkg, function(err, res, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, res, body);
        }
      });
    });
  };
  var scripts = pkg.scripts || {};
  if (scripts.prepublish) {
    childexec(scripts.prepublish, function() {_upload(pkg);});
  } else {
    _upload(pkg);
  }
}

function verifyPackage(pkg) {
  var ret = true;
  log.debug('verify', 'family in package.json');
  if (!pkg.family) {
    log.error('verify', 'family is missing.');
    ret = ret && false;
  }
  log.debug('verify', 'name in package.json');
  if (!pkg.name) {
    log.error('verify', 'name is missing.');
    ret = ret && false;
  }
  log.debug('verify', 'version in package.json');
  if (!pkg.version) {
    log.error('verify', 'version is missing.');
    ret = ret && false;
  }
  if (!semver.valid(pkg.version)) {
    log.error('verify', 'version is invalid.');
    ret = ret && false;
  }
  log.debug('verify', 'dist directory');
  if (!fs.existsSync('dist')) {
    log.error('verify', 'dist not exits.');
    ret = ret && false;
  }
  if (ret) {
    log.info('verify', 'package is awesome.');
    return true;
  }
  log.warn('verify', 'package is broken.');
  return false;
}

function getReadme() {
  var fnames = fs.readdirSync('.');
  var readme;
  fnames.some(function(name) {
    if (/readme\.md/i.test(name)) {
      readme = name;
      return true;
    }
    return false;
  });
  if (readme) {
    return fs.readFileSync(readme, 'utf8');
  }
  return null;
}

function getTarfile(data, callback) {
  var name = format('%s-%s.tar.gz', data.name, data.version);
  var tmp = process.env.TMPDIR || process.env.TEMP || process.env.TMP;
  var tarfile = path.join(tmp, data.family, name);
  log.info('tarfile', name);
  tar.create('.', tarfile, function(error, target) {
    if (error) {
      log.error('exit', error);
      process.exit(1);
    }
    log.debug('tarfile', target);
    callback(null, target);
  });
}
