/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/string.js');
var GLOBAL_CONFIG = require('../config.js');
var PROJECT_CONFIG = require('../../package.json');
var ActionFactory = require('../core/action_factory.js');
var Opts = require('../utils/opts.js');

var Help = ActionFactory.create('Help');

Help.prototype.run = function(callback) {
  var modules = this.opts.argv._.slice(3);
  var spm = require('../spm');
  var out = '';

  // spm help
  if (modules.length === 0) {
    out += ('spm v' + PROJECT_CONFIG.version + '\n');
 
    ActionFactory.getDefaultActionList().forEach(function(action) {
      var message = getHelp(action);
      if (message) {
        out += '\n' + message;
      }
    });
  }
  // spm help xxx
  else {
    var SubAction = modules[0];

    if (SubAction) {
      out += getHelp(SubAction, true, true);
    }
    else {
      out += '! Unknown action: ' + modules[0];
    }
  }

  out += '\n';

  if (callback) {
    callback({ message: out });
  }
  return out;
};

Help.__defineGetter__('completion', function() {
  return GLOBAL_CONFIG.AVAILABLE_ACTIONS.join(' ').replace('help ', '');
});

function getHelp(actionName, verbose, single) {
  var action = ActionFactory.getActionObj(actionName);
  if (action['help']) {
    return action['help'](verbose);
  }
  var opts = Opts.get(action.name);
  return Opts.get(action.name).help() || '';
}

module.exports = Help;
