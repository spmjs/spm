/* publish modules to spmjs.org */

var inquirer = require('inquirer');
var yuan = require('./sdk/yuan');
var color = require('colorful');

module.exports = function(options) {
  if (options.username && options.authkey) {
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
  if (options.authkey && options.username) {
    info.username = options.username;
    info.authkey = options.authkey;
    _login(info);
    return;
  }

  inquirer.prompt([{
      message: "username (your github account username): ",
      name: "username"
    }, {
      type: "password",
      message: "authkey (copy from spmjs account page): ",
      name: "authkey"
  }], function(answers) {
    info.username = answers.username;
    info.authkey = answers.authkey;
    _login(info);
  });

}
