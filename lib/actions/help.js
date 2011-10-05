/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/String');
var CONFIG = require('../config');
var ActionFactory = require('./ActionFactory');


var Help = ActionFactory.create('Help');


Help.prototype.run = function() {
  var args = this.args;
  var spm = require('../spm');

  // spm help
  if (args.length === 0) {
    console.log(('  SeaJS Package Manager v' + CONFIG.VERSION).green);
    console.log('--------------------------------'.green);

    CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      var message = spm[StringUtil.capitalize(actionName)].prototype.help();
      if (message) {
        console.log(message);
      }
    });
  }
  // spm help xxx
  else {
    var SubAction = spm[StringUtil.capitalize(args[0])];

    if (SubAction) {
      console.log(SubAction.prototype.help({ verbose: true }));
    }
    else {
      console.warn('! Unknown action: %s', args[0].cyan);
    }
  }
};


Help.prototype.__defineGetter__('completion', function() {
  return CONFIG.AVAILABLE_ACTIONS.join(' ');
});


module.exports = Help;
