/* install package from spmjs.org */

var async = require('async');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');
var spmrc = require('./config');

exports.run = function(options) {
  var name = options.args[0], server;
  if (options.source) {
    server = spmrc.config('source.' + options.source + '.url');
  } else {
    server = spmrc.config('user.url');
  }
  server = server || 'https://spmjs.org';

  var parsed = iduri.resolve(name);
  if (parsed.type === 'spm') {
    login(server, options, function(error, auth) {
      parsed.server = server;
      parsed.auth = auth;
      yuan(parsed).info(function(error, body) {
        console.log(body.data);
      });
    });
  }
};

function login(server, options, callback) {
  var data, section, auth;
  if (options.username && options.password) {
    data = {account: options.username, password: options.password, server: server};
    yuan(data).login(function(error, response, body) {
      if (error) {
        callback(error);
      } else {
        callback(null, body.data);
      }
    });
  } else {
    if (options.source) {
      section = 'source.' + options.source + '.auth';
    } else {
      section = 'user.auth';
    }
    auth = spmrc.config(section);
    callback(null, auth);
  }
}
