// 1. action 查找 
// 2. action 执行

var utils = require('util')
var opts = require('./utils/opts').get();
var commander = require('./utils/commander.js').get();

commander.
  version(require('../package').version).
  option('--timeout <timeout>', 'Set request service time delay .', parseInt, 6000).
  option('-v --verbose', 'Show more verbose information.', false).parse(process.argv);

if (/spm(\.js)?$/.test(process.argv[1])) {
  // 如果是程序调用 spm 不对 log 模块进行增强. 只是扩展。
  require('./utils/log.js').init(true);
} else {
  require('./utils/log.js').init(false);
}

var spm = module.exports = {};
process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
  console.segm();
  if (commander.verbose) {
    utils.error(err.stack);  
  }
  process.exit(1);
});

// run from commandline
if (require.main) {
  spm.cli = require.main.exports.cli || (require.main === module);
}

var ActionFactory = require('./core/action_factory.js');

spm.getAction = function(commandName) {
  return ActionFactory.getActionObj(commandName);
};

if (spm.cli) {
  var command = process.argv[2];
  // spm --version
  if (command === '-V' || command === '--version') {
    console.info(commander.version());
    process.exit(0);
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
