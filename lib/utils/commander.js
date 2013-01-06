var _ = require('underscore');
var BaseCommander = require('commander');

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
