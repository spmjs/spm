/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu), lifesinger@gmail.com (Frank Wang)
 */
require('./utils/colors.js');
require('./utils/log.js');

var CONFIG = require('./config.js');
var PROJECT_CONFIG = require('../package.json');
var StringUtil = require('./utils/string.js');


var spm = {};

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  process.exit(1);
});

// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  var actionClassName;
  if (Array.isArray(actionName)) {
    actionClassName = StringUtil.capitalize(actionName[0]);
    actionName = actionName[1];
  } else {
   actionClassName = StringUtil.capitalize(actionName);
  }
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
    console.info('v' + PROJECT_CONFIG.version);
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
      console.info(data.message);
    }
  });
}


