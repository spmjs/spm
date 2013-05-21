/* publish modules to spmjs.org */

var log = require('./utils/log');
var commander = require('commander');
var yuan = require('./sdk/yuan');
var iduri = require('./sdk/iduri');


module.exports = function(options) {
  var pkg = iduri.resolve(options.query);
  if (!pkg.version) {
    commander.prompt('  are you sure to delete all versions? (y/N) ', function(sure) {
      console.log();
      if (sure.charAt(0).toLowerCase() === 'y') {
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
