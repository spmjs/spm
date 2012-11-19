define(function(require, exports) {
  var m1 = require('./module.js');
  var m2 = require('./module');

  exports.say = function() {
    m1.get();
    m2.get();
  };
});
