// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var argv = process.argv,
    transport = require('./actions/transport'),
    path = require('path'),
    opts = require('./helper/opts'),
    fs = require('fs'),
    CONFIG = require('./config');

var action = argv.shift();

var actions = {};

if (!action) {
  actions.help();
  return;
}

CONFIG.ENABLE_ACTIONS.forEach(function(action) {
  actions[action] = function() {
    var act = require('./actions/' + action), ins = new act();
    var args = opts.parse([].slice.call(arguments), ins.options);
    ins.run(args);
  };
});

// prepare for commands
var commands = {};
var alias = {
  rm: ['remove'],
  '--help': ['help']
};
for (var i in actions) {
  commands[i] = actions[i];
}
for (var i in alias) {
  commands[i] = actions[alias[i]];
}

// run
if (action in commands) {
  commands[action].apply(this, argv);
  return;
}

console.warn('unknown action %s', action);
actions.help();
