// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');
var CONFIG = require('./config');


var spm = {
  version: '0.3.0',
  config: CONFIG
};


// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  actionName = capital(actionName);
  spm[actionName] = require('./actions/' + actionName);
});


module.exports = spm;

// run directly
if (require.main === module) {
  var args = process.argv;
  (new (spm[capital(args[2])] || spm['Help']))(args.slice(3)).run();
}


function capital(str) {
  return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}
