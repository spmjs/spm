define(function(require, exports) {
  var a = require('./a');
  var b = require('./b.js');
  var c = require('./c.js#');
  exports.say = function() {
    console.info('hi, im main module.');
    a.say();
    b.say();
    c.say();
  };
});
