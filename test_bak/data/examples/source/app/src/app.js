define(function(require, exports) {
  var xbox = require('xbox');
  var apop = require('apop');
  var sub = require('./sub_mod.js');

  require('style.css');

  exports.show = function() {
    xbox.show();
    apop.show();
  };
});
