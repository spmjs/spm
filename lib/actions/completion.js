// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm completion.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var CONFIG = require('../config');
var ActionFactory = require('./ActionFactory');


var Completion = ActionFactory.create('Completion');


Completion.prototype.run = function() {
  var modules = options.modules;
  var options = this.options;
  var out = '';



  var actions = CONFIG.AVAILABLE_ACTIONS.filter(function(action) {
    return action !== 'completion';
  });

  // handle actions alias
  if (modules[0] in CONFIG.ALIASES) {
    modules[0] = CONFIG.ALIASES[modules[0]];
  }

  if (actions.indexOf(modules[0]) !== -1) {
    var action = require('./' + modules[0]);
    process.stdout.write(new action().completion);
  } else {
    for (var i in CONFIG.ALIASES) {
      actions.push(i);
    }
    process.stdout.write(actions.join(' '));
  }
};


module.exports = Completion;
