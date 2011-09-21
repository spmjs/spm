// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');

var CONFIG = require('./config');
var util = require('./helper/util');


var spm = {};


// prepare available actions
CONFIG.AVAILABLE_ACTIONS.forEach(function(actionName) {
  spm[actionName] = function(args) {
    var ActionClass = require('./actions/' + actionName);
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


// run directly
if (require.main === module) {
  var args = process.argv;
  (spm[args[2]] || spm['help'])(args.slice(3));
}
// require()d
else {
  module.exports = spm;
}
