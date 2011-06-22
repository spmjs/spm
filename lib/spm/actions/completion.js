// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SPM AutoCompletion.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var undefined,
    factory = require('../lib/actionFactory'),
    CONFIG = require('../config'),
    fs = require('fs'),
    path = require('path');


var Completion = factory.create(function() {
});


Completion.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {};

  var actions = [];
  CONFIG.ENABLE_ACTIONS.forEach(function(action) {
    if (action !== 'completion')
      actions.push(action);
  });

  // handle actions alias
  if (mods[0] in CONFIG.ALIASES) {
    mods[0] = CONFIG.ALIASES[mods[0]];
  }

  if (actions.indexOf(mods[0]) !== -1) {
    action = require('./' + mods[0]);
    process.stdout.write(new action().completion);
  } else {
    for (var i in CONFIG.ALIASES) {
      actions.push(i);
    }
    process.stdout.write(actions.join(' '));
  }
};

module.exports = Completion;
