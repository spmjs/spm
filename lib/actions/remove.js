// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm remove.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var ActionFactory = require('./ActionFactory'),
    CONFIG = require('../config'),
    reg = require('../utils/Registry.js'),
    registry = new reg(),
    fsExt = require('../utils/fsExt'),
    fs = require('fs'),
    message = require('../config').MESSAGE,
    path = require('path');

var Remove = ActionFactory.create('remove', function() {
  var config = {
    force: false
  };

  for (var i in config) {
    this.config[i] = config[i];
  }

  this.options = {
    force: {
      alias: ['-f', '--force']
    }
  };
});


Remove.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {};

  if (!config.force) {
    process.stdout.write('are you sure want to remove "' +
        mods.join(',') + '"? [Yn]: ');
    process.stdin.resume();
    process.stdin.on('keypress', function(char, key) {
      if (key && key.name == 'y') {
        mods.forEach(remove);
        console.info('%s have been removed successfully', mods.join(','));
      }
      process.exit();
    });
  } else {
    mods.forEach(remove);
    console.info('%s have been removed successfully (force mode)',
        mods.join(','));
  }
};


Remove.prototype.__defineGetter__('completion', function() {
  var completion = [];

  // return all options
  for (var i in this.options) {
    this.options[i].alias.forEach(function(opt) {
      completion.push(opt);
    });
  }

  fs.readdirSync(CONFIG.MODULES_DIR).forEach(function(tspt) {
    completion.push(tspt.replace(/\.tspt$/, ''));
  });

  return completion.join(' ');
});


module.exports = Remove;

function remove(mod) {
  fsExt.rmdirRF(path.join(CONFIG.MODULES_DIR, mod));
  registry.remove(mod, true);
}
