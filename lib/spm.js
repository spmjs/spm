// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var argv = process.argv;
var opts = require('./helper/opts');
var CONFIG = require('./config');


var actions = {};

CONFIG.ENABLE_ACTIONS.forEach(function(action) {
  actions[action] = function() {
    var actionClass = require('./actions/' + action);
    var instance = new actionClass();
    var args = opts.parse([].slice.call(arguments), instance.options);
    instance.run(args);
  };
});


// handle alias
var alias = {
  rm: 'remove'
};

for (var i in alias) {
  if (!(i in actions) && alias[i] in actions) {
    actions[i] = actions[alias[i]];
  }
}


// run
var action = argv.shift();

if (!(action in actions)) {
  action && console.warn('unknown action "%s"', action);
  action = 'help';
}

actions[action].apply(this, argv);
