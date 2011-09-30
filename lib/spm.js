// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');
var CONFIG = require('./config');


var spm = {
  version: '0.3.0',
  config: CONFIG,
  MESSAGE: require('./i18n/' + CONFIG.lang)
};


// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  spm[actionName] = function(args) {
    var ActionClass = require('./actions/' +
        actionName.charAt(0).toUpperCase() + actionName.substring(1));
    new ActionClass(args).run();
  };
});


// handle alias
var alias = CONFIG.ALIASES;

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
