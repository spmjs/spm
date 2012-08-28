// 1. action 查找 
// 2. action 执行

require('./utils/colors.js');
require('./utils/log.js');

var projectInfo = require('../package.json');
var ActionFactory = require('./core/action_factory.js');

var spm = {};
module.exports = spm;

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  process.exit(1);
});

// run from commandline
if (require.main) {
  spm.cli = require.main.exports.cli || (require.main === module);
}

if (spm.cli) {
  var command = process.argv[2];
  command = (command || 'help').toLowerCase();

  // spm --version
  if (command === '-v' || command === '--version') {
    console.info('v' + projectInfo.version);
    process.exit();
  }

  ActionFactory.getActionObj(command).run(function(data) {
    if (data && data.message) {
      console.info(data.message);
     }
  });
}
