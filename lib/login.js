/* publish modules to spmjs.org */

var commander = require('commander');
var yuan = require('./sdk/yuan');

module.exports = function(options) {
  if (options.username && options.password) {
    login(options);
    return;
  }
  console.log();
  commander.prompt('  do you have an account? (Y/n) ', function(have) {
    console.log();
    if (have.charAt(0).toLowerCase() === 'n') {
      register(options);
    } else {
      login(options);
    }
  });
};


function register(options) {
  commander.prompt({
    username: '  username: ',
    email: '  email: '
  }, function(info) {
    commander.password('  password: ', function(password) {
      info.password = password;
      yuan(options).register(info, function(err) {
        console.log();
        if (err) {
          var errors = err.split('\n');
          errors.forEach(function(msg) {
            console.error('  ' + msg);
          });
        } else {
          console.log('  register: register and login success.');
        }
      });
    });
  });
}

function login(options) {
  var info = {};
  var _login = function(info) {
    yuan(options).login(info, function(err) {
      console.log();
      if (err) {
        var errors = err.split('\n');
        errors.forEach(function(msg) {
          console.error('  ' + msg);
        });
      } else {
        console.log('  login: login success.');
      }
    });
  };
  if (options.password && options.username) {
    info.username = options.username;
    info.password = options.password;
    _login(info);
    return;
  }
  commander.prompt('  username: ', function(username) {
    info.username = username;
    commander.password('  password: ', function(password) {
      info.password = password;
      _login(info);
    });
  });
}
