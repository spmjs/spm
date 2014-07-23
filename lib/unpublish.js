/* publish modules to spmjs.org */

var log = require('./utils/log');
var inquirer = require('inquirer');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');


module.exports = function(options) {
  var pkg = iduri.resolve(options.query);
  if (!pkg) {
    log.error('error', 'invalid module name');
    process.exit(2);
  }
  if (!pkg.version) {
    inquirer.prompt({
      type: 'confirm',
      name: 'sure',
      message: "are you sure to delete all versions?",
      default: false
    }, function(answers) {
      console.log();
      if (answers.sure) {
        unpublish(options, pkg);
      } else {
        process.exit();
      }
    });
  } else {
    unpublish(options, pkg);
  }
};

function unpublish(options, pkg) {
  yuan(options).unpublish(pkg, function(err, res, body) {
    if (err) {
      log.error('exit', err);
      process.exit(1);
    } else {
      log[body.status](body.status, body.message);
      process.exit();
    }
  });
}
