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
    out += '--------------------------------\n';
    out += ('  SeaJS Package Manager v' + GLOBAL_CONFIG.VERSION);
    out += '\n--------------------------------';

    GLOBAL_CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      var message = getHelp(spm[StringUtil.capitalize(actionName)]);
      if (message) {
        out += '\n\n' + message;
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
      out += '! Unknown action: ' + args[0];
    }
  }

  out += '\n';
  
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

  var result = '';

  // basic help
  if (!verbose) {
    result += SubAction.name_.toLowerCase().cyan + '\n';
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
        optionsHelp += '\n  ' + alias;
        optionsHelp += getSpace(22, alias) + options[p].description;
      }
    }

    if (optionsHelp) {
      optionsHelp = '\n\nOptions:' + optionsHelp;
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
