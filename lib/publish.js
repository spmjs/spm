/* publish modules to spmjs.org */

var fs = require('fs');
var path = require('path');
var commander = require('commander');
var format = require('util').format;
var logging = require('colorful').logging;
var semver = require('semver');
var tar = require('./utils/tar');
var childexec = require('./utils').childexec;
var grunt = require('./sdk/grunt');
var _module = require('./sdk/module');
var yuan = require('./sdk/yuan');
var spmrc = require('./config');


exports.run = function(options) {
  logging.start('Publishing');
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.source');
  }
  server = server || 'https://spmjs.org';
  login(server, options, function(err, auth) {
    options.auth = auth;
    upload(server, options, function(err, res, body) {
      if (err) {
        logging.error(err);
        process.exit(1);
      } else if (!(res.statusCode === 200 || res.statusCode === 201)) {
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
        logging[body.status](body.message);
      }
      logging.end('Publish success.');
    });
  });
};


function login(server, options, callback) {
  if (options.username && options.password) {
    var data = {account: options.username, password: options.password, server: server};
    yuan(data).login(function(error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body.data);
      }
    });
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
    text = format('username or email(%s): ', username);
  } else {
    text = format('username or email: ', username);
  }
  commander.prompt(text, function(account) {
    if (!account && username) account = username;

    commander.password('password: ', function(password) {
      logging.info('login', server);

      var data = {account: account, password: password, server: server};
      yuan(data).login(function(error, response, body) {
        if (error) {
          callback(error);
        } else {
          spmrc.config(section, body.data);
          callback(null, body.data);
        }
      });
    });
  });
}

function upload(server, options, callback) {
  var pkg = grunt.file.readJSON('package.json');

  var _upload = function(data) {
    // verify package.json
    if (!verifyPackage(data)) {
      process.exit(1);
    }
    data.server = server;
    data.auth = options.auth;
    data.force = options.force;
    var readme = getReadme();
    if (readme) {
      data.readme = readme;
    } else {
      logging.warn('readme not found.');
    }
    if (options.tag) {
      data.tag = options.tag;
    } else {
      data.tag = 'stable';
    }
    data.dependencies = Object.keys(_module.distDependencies());
    getTarfile(data, function(err, target) {
      data.tarfile = target;
      yuan(data).publish(function(err, res, body) {
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
  logging.start('Verifying package.');
  var ret = true;
  logging.debug('Verifying family...');
  if (!pkg.family) {
    logging.error('family is missing.');
    ret = ret && false;
  }
  logging.debug('Verifying name...');
  if (!pkg.name) {
    logging.error('name is missing.');
    ret = ret && false;
  }
  logging.debug('Verifying version...');
  if (!pkg.version) {
    logging.error('version is missing.');
    ret = ret && false;
  }
  if (!semver.valid(pkg.version)) {
    logging.error('version is invalid.');
    ret = ret && false;
  }
  logging.debug('Verifying dist directory...');
  if (!fs.existsSync('dist')) {
    logging.error('dist not found.');
    ret = ret && false;
  }
  if (ret) {
    logging.end('package is awesome.');
    return true;
  }
  logging.end('package is broken.');
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
  var name = format('spm-%s-%s-%s.tar.gz', data.family, data.name, data.version);
  var tarfile = path.join(process.env.TMPDIR, name);
  logging.debug('Creating tar:', tarfile);
  tar.create('.', tarfile, function(error, target) {
    if (error) {
      logging.error(error);
      process.exit(1);
    }
    callback(null, target);
  });
}
