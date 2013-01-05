var _ = require('underscore');
var BaseCommander = require('commander');

var CommanderCache = {};

var get = exports.get = function(action, parentCommander) {
  if (!action) return BaseCommander;

  return CommanderCache[action] ||
      CommanderCache[action] = extend(CommanderCache[parentCommander] || BaseCommander);
};

function extend(parentCommander) {
  var newCommander = require('commander');
  newCommander.options = _.defaults(parentCommander.options);
  newCommander.actions = _.defaults(parentCommander.actions);
  return newCommander;
}

exports._allCommander = function() {
  return _.keys(CommanderCache);
};
