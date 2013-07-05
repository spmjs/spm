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


exports.publish = function(options, callback) {
  var pkg = file.readJSON('package.json');
  if (!pkg) {
    log.error('miss', 'package.json');
    process.exit(2);
  }
  var keys = ['family', 'name', 'version'];
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
  var name = pkg.family + '/' + pkg.name + '@' + pkg.version;
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
      log.info('published', name);
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
  log.debug('verify', 'dist directory');
  if (!fs.existsSync('dist')) {
    log.warn('verify', 'dist not exits.');
  }

  var alias = {};
  if (pkg.spm && pkg.spm.alias) {
    alias = pkg.spm.alias;
  }
  pkg.dependencies = mo.parseAlias(alias);

  var fnames = fs.readdirSync('.');
  fnames.some(function(name) {
    if (/^readme\.(md|mkd|markdown)$/i.test(name)) {
      log.info('found', 'readme in markdown.');
      pkg.readme = file.read(name);
      return true;
    }
  });

  pkg.distfiles = [];
  file.recurse('dist', function(fpath) {
    pkg.distfiles.push(fpath.replace(/^dist\//, ''));
  });
  return pkg;
}

function _createTar(directory, data, callback) {
  var name = format('%s-%s.tar.gz', data.name, data.version || '');
  var tmp = spmrc.get('user.temp');
  var tarfile = path.join(tmp, data.family, name);
  log.info('tarfile', name);
  tar.create(directory, tarfile, function(error, target) {
    if (error) {
      log.error('exit', error);
      process.exit(1);
    }
    log.debug('tarfile', target);
    callback(null, target);
  });
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
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (body.message && body.status) {
        log[body.status](body.status, body.message);
      }
    });
  });
};
