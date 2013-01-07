var _ = require('underscore');
var BaseCommander = require('commander');

function parseBoolean(val) {
  if (val) return 1;
  else return 2;
}

BaseCommander.
  version(require('../../package').version).
  option('--timeout [timeout]', 'Set request service time delay. default 6000ms.', parseInt, 6000).
  option('--encoding [encoding]', 'Set file encoding. default utf8.', String, 'utf8').
  option('-v --verbose [num]', 'Show more verbose information.', parseBoolean, 2).parse(process.argv);

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
