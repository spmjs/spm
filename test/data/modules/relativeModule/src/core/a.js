define(function(require, exports) {
  var b = require('./b');
  exports.say = function() {
    b.say();
  };
});
