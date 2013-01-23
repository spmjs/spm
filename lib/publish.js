/* publish modules to spmjs.org */

var fs = require('fs-extra');
var path = require('path');
var commander = require('commander');
var format = require('util').format;
var logging = require('colorful').logging;
var tar = require('./utils/tar');
var childexec = require('./utils').childexec;
var yuan = require('./sdk/yuan');
var spmrc = require('./config');


exports.run = function(options) {
  logging.start('Publishing');
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.url');
  }
  server = server || 'https://spmjs.org';
  login(server, options, function(err, auth) {
    options.auth = auth;
    upload(server, options, function(error, response, body) {
      if (error) {
        logging.error(error);
        process.exit(1);
      }
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (body.message) {
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
  var data = fs.readJSONFileSync('package.json');
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
    // data.dependencies
    if (options.tag) data.tag = options.tag;
    getTarfile(data, function(error, target) {
      data.tarfile = target;
      yuan(data).publish(function(error, response, body) {
        if (error) {
          callback(error);
        } else {
          callback(null, response, body);
        }
      });
    });
  };
  var scripts = data.scripts || {};
  if (scripts.prepublish) {
    childexec(scripts.prepublish, function() {_upload(data);});
  } else {
    _upload(data);
  }
}

function verifyPackage(data) {
  logging.start('verify package.json');
  // root, name, version are required
  if (data.root && data.name && data.version) {
    logging.end('package.json is awesome.');
    return true;
  }
  if (!data.root) logging.error('root is missing.');
  if (!data.name) logging.error('name is missing.');
  if (!data.version) logging.error('version is missing.');
  logging.end('package.json is broken.');
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
  });
  if (readme) {
    return fs.readFileSync(readme, 'utf8');
  }
  return null;
}

function getTarfile(data, callback) {
  var name = format('spm-%s-%s-%s.tar.gz', data.root, data.name, data.version);
  var tarfile = path.join(process.env.TMPDIR, name);
  tar.create('.', tarfile, function(error, target) {
    if (error) {
      logging.error(error);
      process.exit(1);
    }
    callback(null, target);
  });
}
