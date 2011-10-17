/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

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
    out += ('  SeaJS Package Manager v' + GLOBAL_CONFIG.VERSION).green;
    out += '\n--------------------------------'.green;

    GLOBAL_CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      var message = spm[StringUtil.capitalize(actionName)].prototype.help();
      if (message) {
        out += '\n' + message;
      }
    });
  }
  // spm help xxx
  else {
    var SubAction = spm[StringUtil.capitalize(args[0])];

    if (SubAction) {
      out += SubAction.prototype.help({ verbose: true });
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
  return GLOBAL_CONFIG.AVAILABLE_ACTIONS.join(' ');
});


module.exports = Help;
