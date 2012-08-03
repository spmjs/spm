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

var OPTION_TYPES = Options.TYPES;


var Help = ActionFactory.create('Help');


Help.AVAILABLE_OPTIONS = {
  verbose: {
    alias: ['--verbose', '-v'],
    description: 'Show more verbose information.'
  }
};


Help.prototype.run = function(callback) {
  var modules = this.modules;
  var options = this.options;
  var spm = require('../spm');
  var out = '';

  // spm help
  if (modules.length === 0) {
    out += ('spm v' + PROJECT_CONFIG.version);

    GLOBAL_CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      if (Array.isArray(actionName)) {
        actionName = actionName[1];
      }

      var message = getHelp(
          spm[StringUtil.capitalize(actionName)],
          options.verbose
      );

      if (message) {
        out += '\n\n' + message;
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

  var MESSAGE = SubAction.MESSAGE;
  if (!MESSAGE) {
    return '';
  }

  var result = '';

  // basic help
  if (!single) {
    result += ('spm ' + SubAction.name_.toLowerCase()).cyan + '\n';
  }
  result += MESSAGE['USAGE'] + '\n';
  result += '       ' + MESSAGE['DESCRIPTION'];

  // verbose help
  if (verbose) {
    var options = SubAction.AVAILABLE_OPTIONS || {};
    var optionsHelp = '';

    for (var p in options) {
      if (options.hasOwnProperty(p)) {
        var alias = options[p].alias.join(', ');
        optionsHelp += '\n    ' + alias;
        optionsHelp += getSpace(22, alias) + options[p].description;
      }
    }

    if (optionsHelp) {
      optionsHelp = '\n' + optionsHelp;
    }

    result += optionsHelp;
  }

  return result;
}


function getSpace(num, left) {
  var result = '';
  for (var i = left.length; i < num; i++) {
    result += ' ';
  }
  return result;
}


module.exports = Help;
