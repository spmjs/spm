/* publish modules to spmjs.org */

var commander = require('commander');
var format = require('util').format;
var logging = require('colorful').logging;
var tar = require('./utils/tar');
var yuan = require('./sdk/yuan');
var spmrc = require('./config');


exports.run = function(options) {
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.url');
  }
  server = server || 'https://spmjs.org';
  login(server, options, function(err, auth) {
    console.log(auth);
  });
};


function login(server, options, callback) {
  if (options.username && options.password) {
    var data = {account: options.username, password: options.password, server: server};
    yuan(data).login(function(error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body.data.auth);
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
          spmrc.config(section, body.data.auth);
          callback(null, body.data.auth);
        }
      });
    });
  });
}

function upload(server, options, callback) {
  tar.create('.', tmp);
}
