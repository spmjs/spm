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
  actionName = StringUtil.capitalize(actionName);
  spm[actionName] = require('./actions/' + actionName);
});


module.exports = spm;

// run from commandline
if (require.main) {
  spm.cli = require.main.exports.cli || (require.main === module);
}

if (spm.cli) {
  var args = process.argv;
  var Action = spm['Help'];

  var actionName = StringUtil.capitalize(args[2]);
  if (spm[actionName]) {
    Action = spm[actionName];
  }

  new Action(args.slice(3)).run(function(data) {
    if (data && data.message) {
      console.log(data.message);
    }
  });
}
