// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');

var CONFIG = require('./config');
var StringUtil = require('./utils/String');


var spm = {
  version: '0.3.0',
  config: CONFIG
};


// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  actionName = StringUtil.capitalize(actionName);
  spm[actionName] = require('./actions/' + actionName);
});


module.exports = spm;

// run directly
if (require.main === module) {
  var args = process.argv;
  var Action = spm[StringUtil.capitalize(args[2])] || spm['Help'];
  new Action(args.slice(3)).run();
}
