/* publish modules to spmjs.org */

var commander = require('commander');
var format = require('util').format;
var yuan = require('./sdk/yuan');
var spmrc = require('./config');


exports.run = function(options) {
  var auth = spmrc.config('user.auth');
  if (!auth) {
  }
};


function login(section, callback) {
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
      var data = {account: account, password: password};
    });
  });
}
