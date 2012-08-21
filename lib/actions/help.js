/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/string.js');
var GLOBAL_CONFIG = require('../config.js');
var PROJECT_CONFIG = require('../../package.json');
var ActionFactory = require('./action_factory.js');
var Options = require('../utils/options.js');
var Opts = require('../utils/opts.js');

var OPTION_TYPES = Options.TYPES;


var Help = ActionFactory.create('Help');

Help.prototype.run = function(callback) {
  var modules = this.modules;
  var options = this.options;
  var spm = require('../spm');
  var out = '';

  // spm help
  if (modules.length === 0) {
    out += ('spm v' + PROJECT_CONFIG.version + '\n');

    GLOBAL_CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      
      var message = getHelp(
          spm[StringUtil.capitalize(actionName)]
      );

      if (message) {
        out += '\n' + message;
      }
    });
  }
  // spm help xxx
  else {
    var SubAction = spm[StringUtil.capitalize(modules[0])];

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

function getHelp(SubAction, verbose, single) {
  if (SubAction['help']) {
    return SubAction['help'](verbose);
  }
  var opts = Opts.get(SubAction.name_);
  return Opts.get(SubAction.name_).help() || '';
}

module.exports = Help;
