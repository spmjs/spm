var _ = require('underscore');
var BaseCommander = require('commander');

function parseBoolean(val) {
  if (val) return 1;
  else return 2;
}

BaseCommander.
  version(require('../../package').version).
  option('--timeout [timeout]', '设置相关网络操作的延时时间, 默认 6000ms.', parseInt, 6000).
  option('--encoding [encoding]', '设置文本文件读取和写入时的默认编码, 默认是 utf8.', String, 'utf8').
  option('-v --verbose [num]', '是否显示更多的日志信息，主要用来错误定位.', parseBoolean, 2).parse(process.argv);

var CommanderCache = {
  '_base': BaseCommander
};

var get = exports.get = function(action, parentCommander) {
  if (!action) return BaseCommander;
  parentCommander = parentCommander || '_base';
  return CommanderCache[action] ||
      (CommanderCache[action] = extend(CommanderCache[parentCommander]));
};

var extend = exports.extend = function(parentCommander) {
  var newCommander = new (require('commander').Command);

  newCommander.options = _.clone(parentCommander.options);
  newCommander.actions = _.clone(parentCommander.actions);
  newCommander.parse(process.argv);
  return newCommander;
}

exports._allCommander = function() {
  return _.keys(CommanderCache);
};
