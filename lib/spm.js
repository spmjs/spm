// 1. action 查找 
// 2. action 执行

require('colors');
var utils = require('util')
require('./utils/log.js');

var projectInfo = require('../package.json');
var ActionFactory = require('./core/action_factory.js');

var spm = module.exports = {};

function gExpose(obj, methodName, newMethodName) {
  spm[newMethodName || methodName] = obj[methodName].bind(obj);
}

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  console.segm();
  utils.error(err.stack);  
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

  var begin = new Date().getTime();
  ActionFactory.getActionObj(command).run(function(data) {
    if (data && data.message) {
      console.info(data.message);
     }
     
     var end = new Date().getTime();
     console.info('Total time: ' + (end - begin) / 1000 + 's');
     console.info('Finished at: ' + (new Date()));
     var usage = process.memoryUsage();
     var all = Math.round(usage.heapTotal / (1024 * 1024));
     var used = Math.round(usage.heapUsed / (1024 * 1024));
     console.info('Final Memory: ' + used + 'M/' + all + 'M');
     console.segm();
  });
}
