// 1. action 查找 
// 2. action 执行

require('colors');
require('./utils/log.js');

var projectInfo = require('../package.json');
var ActionFactory = require('./core/action_factory.js');

var spm = module.exports = {};

function gExpose(obj, methodName, newMethodName) {
  spm[newMethodName || methodName] = obj[methodName].bind(obj);
}

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  process.exit(1);
});

// run from commandline
if (require.main) {
  spm.cli = require.main.exports.cli || (require.main === module);
}

spm.getAction = function(commandName) {
  return ActionFactory.getActionObj(commandName);
};

if (spm.cli) {
  var command = process.argv[2];
  command = (command || 'help').toLowerCase();

  // spm --version
  if (command === '-v' || command === '--version') {
    console.info(('v' + projectInfo.version));
    process.exit();
  }

  ActionFactory.getActionObj(command).run(function(data) {
    if (data && data.message) {
      console.info(data.message);
     }
  });
}
