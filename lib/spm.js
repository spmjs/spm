/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu), lifesinger@gmail.com (Frank Wang)
 */
require('./utils/colors.js');

var CONFIG = require('./config.js');
var StringUtil = require('./utils/string.js');


var spm = {};


// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  var actionClassName = StringUtil.capitalize(actionName);
  spm[actionClassName] = require('./actions/' + actionName);
});


module.exports = spm;

// run from commandline
if (require.main) {
  spm.cli = require.main.exports.cli || (require.main === module);
}

if (spm.cli) {
  var args = process.argv;
  var command = args[2];

  // spm --version
  if (command === '-v' || command === '--version') {
    console.log('v' + CONFIG.VERSION);
    process.exit();
  }

  // spm action [options]
  var Action = spm['Help'];

  var actionClassName = StringUtil.capitalize(command);
  if (spm[actionClassName]) {
    Action = spm[actionClassName];
  }

  new Action(args.slice(3)).run(function(data) {
    if (data && data.message) {
      console.log(data.message);
    }
  });
}

