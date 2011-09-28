// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');
var config = require('./config');


var spm = {
  version: '0.3.0',
  config: config,
  MESSAGE: require('./i18n/' + config.lang)
};


// prepare available actions
config.AVAILABLE_ACTIONS.forEach(function(actionName) {
  spm[actionName] = function(args) {
    var ActionClass = require('./actions/' +
        actionName.charAt(0).toUpperCase() + actionName.substring(1));
    new ActionClass(args).run();
  };
});


// handle alias
var alias = config.ALIASES;

for (var k in alias) {
  var v = alias[k];
  if (!spm[k] && spm[v]) {
    spm[k] = spm[v];
  }
}


module.exports = spm;

// run directly
if (require.main === module) {
  var args = process.argv;
  (spm[args[2]] || spm['help'])(args.slice(3));
}
