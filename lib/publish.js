/* publish modules to spmjs.org */

var fs = require('fs');
var path = require('path');
var format = require('util').format;
var semver = require('semver');
var color = require('colorful').color;
var tar = require('./utils/tar');
var log = require('./utils/log');
var childexec = require('./utils').childexec;
var file = require('./sdk/file');
var mo = require('./sdk/module');
var yuan = require('./sdk/yuan');
var git = require('./sdk/git');
var spmrc = require('./config');
var NAME_REGEX = require('./sdk/iduri').NAME_REGEX;

exports.publish = function(options, pkg, callback) {
  var keys = ['name', 'version'];
  keys.forEach(function(key) {
    log.debug('verify', key + ' in package.json');
    if (!pkg[key]) {
      log.error('verify', key + ' is missing.');
      process.exit(1);
    }
  });
  if (!semver.valid(pkg.version)) {
    log.error('verify', 'version is invalid.');
    process.exit(1);
  }
  pkg.name = pkg.name.toLowerCase();
  if (!NAME_REGEX.test(pkg.name)) {
    log.error('verify', 'name is invalid, should match ' + NAME_REGEX.toString());
    process.exit(1);
  }
  var name = pkg.name + '@' + pkg.version;
  if (options.tag) {
    name += ' ~ ' + options.tag;
  }
  log.info('publish', color.magenta(name));

  var done = function(err, res, body) {
    if (err) {
      log.error('exit', err);
      if (callback) {
        callback(err);
      } else {
        process.exit(1);
      }
    } else if (!(res.statusCode === 200 || res.statusCode === 201)) {
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      log[body.status](body.status, body.message);
    } else {
      log.info('published', color.green(name));
    }
    if (callback) {
      callback();
    }
  };

  var scripts = pkg.scripts || {};
  if (scripts.prepublish) {
    childexec(scripts.prepublish, function() {
      _publishPackage(options, pkg, done);
    });
  } else {
    _publishPackage(options, pkg, done);
  }
};

function _publishPackage(options, pkg, callback) {
  pkg = _generatePackage(pkg);

  var _pub = function() {
    pkg.tag = options.tag || 'stable';
    if (fs.existsSync('.git')) {
      git.revision(function(err, rev) {
        if (!err && rev) {
          pkg.revision = rev.trim();
        }
        yuan(options).publish(pkg, callback);
      });
    } else {
      yuan(options).publish(pkg, callback);
    }
  };

  if (options.tarball) {
    _createTar('.', pkg, function(err, target) {
      options.tarfile = target;
      _pub();
    });
  } else {
    _pub();
  }
}

function _generatePackage(pkg) {
  var deps = {};
  if (pkg.spm && pkg.spm.dependencies) {
    deps = pkg.spm.dependencies;
  }
  pkg.dependencies = mo.parseDependencies(deps);

  var fnames = fs.readdirSync('.');
  fnames.some(function(name) {
    if (/^readme\.(md|mkd|markdown)$/i.test(name)) {
      log.info('found', 'readme in markdown.');
      pkg.readme = file.read(name);
      return true;
    }
  });

  return pkg;
}

function _createTar(directory, data, callback, noIgnore) {
  var name = format('%s-%s.tar.gz', data.name, data.version || '');
  var tmp = spmrc.get('user.temp');
  var tarfile = path.join(tmp, name);
  tar.create(directory, tarfile, function(error, target) {
    var size = fs.statSync(target).size;
    log.info('tarfile', name + ' - ' + ((size/1024).toFixed(2) + 'KB').to.magenta);
    // 2 MB
    if (size > 2079152) {
      log.warn('size', 'package is a little big, maybe you need a .spmignore');
    }
    if (error) {
      log.error('exit', error);
      process.exit(1);
    }
    log.debug('tarfile', target);
    callback(null, target);
  }, noIgnore);
}

exports.upload = function(options) {
  var doc = options.doc || '_site';
  log.info('upload', doc);
  var pkg = file.readJSON('package.json');
  _createTar(doc, pkg, function(err, target) {
    pkg.tarfile = target;
    pkg.tag = options.tag;
    yuan(options).upload(pkg, function(err, res, body) {
      if (err) {
        log.error('exit', err);
        process.exit(1);
      }
      if (res.statusCode >= 400) {
        log.error('exit', res.statusCode);
      }
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (body.message && body.status) {
        log[body.status](body.status, body.message);
      }
    });
  }, true);
};
