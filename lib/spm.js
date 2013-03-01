// 1. action 查找
// 2. action 执行

'use strict';

var utils = require('util');
var async = require('async');

var commander = require('./utils/commander.js').get();

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
ActionFactory.initAllAction();

spm.getAction = function(commandName) {
  return ActionFactory.getActionObj(commandName);
};

if (spm.cli) {

  // 1.如果用户第二个参数是 grunt, 那么执行完第一个 action 后，会继续执行 grunt

  var args = commander.args;
  var actions = [args[0]];

  if (args[1] == 'grunt') {
    actions.push(args[1]);
  }

  begin = new Date().getTime();

  var begin, end, usage, all, used;
  async.forEachSeries(actions, function(command, cb) {

    ActionFactory.getActionObj(command).run(function(data) {
      if (data && data.message) {
        console.info(data.message);
       }
       cb();
    });
  }, function() {
    end = new Date().getTime();
    console.info('Total time: ' + (end - begin) / 1000 + 's');
    console.info('Finished at: ' + (new Date()));
    usage = process.memoryUsage();
    all = Math.round(usage.heapTotal / (1024 * 1024));
    used = Math.round(usage.heapUsed / (1024 * 1024));
    console.info('Final Memory: ' + used + 'M/' + all + 'M');
    console.segm();
  });
}
