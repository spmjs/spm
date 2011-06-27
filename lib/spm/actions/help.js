// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm help.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var factory = require('../lib/actionFactory'),
    CONFIG = require('../config'),
    fs = require('fs'),
    path = require('path');


var Help = factory.create(function() {
  this.options = {
    force: {
      alias: ['-f', '--force']
    },
    gzip: {
      alias: ['-g', '--gzip']
    }
  };
});


Help.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {},
      action;

  console.log('SeaJS Package Manager'.green.bold);
  console.log('====================='.green);
  if (mods.length === 0) {
    CONFIG.ENABLE_ACTIONS.forEach(function(action) {
      var act = require('./' + action),
          help = new act({global: true}).help;
      if (help.trim() !== '')
        console.log(new act({global: true}).help);
    });
  } else {
    action = mods[0];
    if (!path.existsSync(path.join(__dirname, action + '.js'))) {
      console.log('unknown action %s', action.cyan);
      return;
    }
    var act = require('./' + action);
    console.log(new act().help);
  }
};


Help.prototype.__defineGetter__('completion', function(opts) {
  return CONFIG.ENABLE_ACTIONS.join(' ');
});

module.exports = Help;
