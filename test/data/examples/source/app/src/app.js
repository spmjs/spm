define(function(require, exports) {
  var xbox = require('xbox');
  var apop = require('apop');
  exports.show = function() {
    xbox.show();
    apop.show();
  };
});
