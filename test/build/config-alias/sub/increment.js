define(function(require, exports) {

  var add = require('lib/math').add;

  exports.increment = function(val) {
    return add(val, 1);
  }

});
