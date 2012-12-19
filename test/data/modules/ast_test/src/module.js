// comment1
// var b = require('./a');
// var c = require('./b');

/**
 * var c = require('./c');
 */
define(function(require, exports) {
  var foo = require('./foo.js');

  var alice = require('./a.css');
  var tpl = require('./b.tpl');
  exports.say = function() {
    foo.say();  // var c = require('./d');
  };

  exports.hi1 = function() {
    var hello = 'nihao';
    return hello;
  };

  exports.hi1 = function() {
    eval('var dd = 11');
    var hello = 'nihao';
    return hello;
  };
});
