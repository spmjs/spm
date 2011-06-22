// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var argv = process.argv,
    opts = require('./helper/opts'),
    CONFIG = require('./config');

var actions = {};
CONFIG.ENABLE_ACTIONS.forEach(function(action) {
  actions[action] = function() {
    var act = require('./actions/' + action), ins = new act();
    var args = opts.parse([].slice.call(arguments), ins.options);
    ins.run(args);
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
  console.warn('unknown action "%s"', action);
  action = 'help';
}

actions[action].apply(this, argv);
