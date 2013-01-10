var util = require('util');
var _ = require('underscore');
var Command = require('commander').Command;

function SPMCommand() {
  this._optionsArg = [];
  Command.call(this);
}

util.inherits(SPMCommand, Command);

SPMCommand.prototype.option = function() {
  args = [].slice.call(arguments, 0);
  this._optionsArg.push(args);
  SPMCommand.super_.prototype.option.apply(this, arguments);
  return this;
};

var BaseCommander = new SPMCommand();

BaseCommander.
  version(require('../../package').version).
  option('--timeout [timeout]', '设置相关网络操作的延时时间, 默认 6000ms.', parseInt, 6000).
  option('--encoding [encoding]', '设置文本文件读取和写入时的默认编码, 默认是 utf8.', String, 'utf8').
  option('-q, --quiet', '只显示警告和错误信息').
  option('-v --verbose', '是否显示更多的日志信息，主要用来错误定位.').parse(process.argv);

var CommanderCache = {
  '_base': BaseCommander
};

var get = exports.get = function(action, parentCommanderKey) {
  if (!action) return BaseCommander;
  parentCommanderKey = parentCommanderKey || '_base';
  var parentCommander = CommanderCache[parentCommanderKey || '_base'];
  var commander = CommanderCache[action];

  if (!commander) {
    commander = extend(parentCommander, action);
    CommanderCache[action] = commander;
  }

  return commander;
};

var extend = exports.extend = function(parentCommander, action) {
  var newCommander = new SPMCommand();

  (parentCommander._optionsArg || []).forEach(function(optionArg) {
    newCommander.option.apply(newCommander, optionArg);
  });

  newCommander.usage(action + ' [options]');
  /**
  newCommander.on('help', function() {
    process.exit(0);
  });
  */
  return newCommander;
};

exports._allCommander = function() {
  return _.keys(CommanderCache);
};
