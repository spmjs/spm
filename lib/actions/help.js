/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */
require('colors');

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/String');
var GLOBAL_CONFIG = require('../config');
var ActionFactory = require('./ActionFactory');


var Help = ActionFactory.create('Help');


Help.prototype.run = function(config) {
  var args = this.args;
  var spm = require('../spm');
  var out = '';

  // spm help
  if (args.length === 0) {
    out += '--------------------------------\n'.grey;
    out += ('  SeaJS Package Manager v' + GLOBAL_CONFIG.VERSION).grey;
    out += '\n--------------------------------'.grey;

    GLOBAL_CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      var message = getHelp(spm[StringUtil.capitalize(actionName)]);
      if (message) {
        out += '\n' + message;
      }
    });
  }
  // spm help xxx
  else {
    var SubAction = spm[StringUtil.capitalize(args[0])];

    if (SubAction) {
      out += getHelp(SubAction, true);
    }
    else {
      out += '! Unknown action: ' + args[0].cyan;
    }
  }

  if (config && config.console) {
    console.log(out);
  }
  return out;
};


Help.__defineGetter__('completion', function() {
  return GLOBAL_CONFIG.AVAILABLE_ACTIONS.join(' ').replace('help ', '');
});


function getHelp(SubAction, verbose) {
  if (SubAction.help) {
    return SubAction.help(verbose);
  }

  var MESSAGE = SubAction.MESSAGE;
  if (!MESSAGE) {
    return '';
  }

  // basic help
  var result = SubAction.name_.toLowerCase() + '\n';
  result += '  ' + MESSAGE['USAGE'].cyan + '\n';
  result += '  ' + MESSAGE['DESCRIPTION'].grey;

  // verbose help
  if (verbose) {
    var options = SubAction.AVAILABLE_OPTIONS || {};
    var optionsHelp = '';

    for (var p in options) {
      if (options.hasOwnProperty(p)) {
        optionsHelp += '\n  ' + options[p].alias.join(' / ').cyan;
        optionsHelp += '\n    ' + options[p].description.grey;
      }
    }

    result += optionsHelp;
  }

  return result;
}


module.exports = Help;
