/* publish modules to spmjs.org */

var commander = require('commander');
var yuan = require('./sdk/yuan');
var color = require('colorful');

module.exports = function(options) {
  if (options.username && options.token) {
    login(options);
    return;
  }
  console.log();
  login(options);
};

function login(options) {
  var info = {};
  var _login = function(info) {
    yuan(options).login(info, function(err) {
      console.log();
      if (err) {
        var errors = err.split('\n');
        errors.forEach(function(msg) {
          console.error('  ' + color.red(msg));
        });
      } else {
        console.log(color.green('  login success.'));
      }
    });
  };
  if (options.token && options.username) {
    info.username = options.username;
    info.token = options.token;
    _login(info);
    return;
  }
  commander.prompt('  username: ', function(username) {
    info.username = username;
    commander.password('  token (copy from spmjs account page): ', function(token) {
      info.token = token;
      _login(info);
    });
  });
}
