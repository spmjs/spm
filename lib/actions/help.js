// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var CONFIG = require('../config');
var ActionFactory = require('./ActionFactory');


var Help = ActionFactory.create('Help');


Help.prototype.AVAILABLE_OPTIONS = {
  force: {
    alias: ['-f', '--force']
  },
  gzip: {
    alias: ['-g', '--gzip']
  }
};


Help.prototype.run = function() {
  var config = this.config;
  var modules = config.modules || [];

  // spm help
  if (modules.length === 0) {
    console.log(('  SeaJS Package Manager v' + CONFIG.VERSION).green);
    console.log('--------------------------------'.green);

    CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
      var action = require('./' + actionName);

      var message = action.prototype.help();
      if (message) {
        console.log(message);
      }
    });
  }
  // spm help xxx
  else {
    var actionName = modules[0];
    if (!path.existsSync(path.join(__dirname, actionName + '.js'))) {
      console.warn('! Unknown action: %s', actionName.cyan);
      return;
    }

    var action = require('./' + actionName);
    console.log(action.prototype.help({ verbose: true }));
  }
};


Help.prototype.__defineGetter__('completion', function() {
  return CONFIG.AVAILABLE_ACTIONS.join(' ');
});


module.exports = Help;
