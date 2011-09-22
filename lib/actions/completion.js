// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm completion.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var CONFIG = require('../config');
var createAction = require('./action_factory');


var Completion = createAction('completion');


Completion.prototype.run = function(opts) {
  opts = opts || {};
  var mods = opts.mods || [];

  var actions = [];
  CONFIG.AVAILABLE_ACTIONS.forEach(function(action) {
    if (action !== 'completion')
      actions.push(action);
  });

  // handle actions alias
  if (mods[0] in CONFIG.ALIASES) {
    mods[0] = CONFIG.ALIASES[mods[0]];
  }

  if (actions.indexOf(mods[0]) !== -1) {
    var action = require('./' + mods[0]);
    process.stdout.write(new action().completion);
  } else {
    for (var i in CONFIG.ALIASES) {
      actions.push(i);
    }
    process.stdout.write(actions.join(' '));
  }
};

module.exports = Completion;
