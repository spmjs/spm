define(function(require, exports) {
  // var a = require('a');
  // var b = require('b');
  // var c = require('c');

  var d = require('./jsonModule.js');

  exports.get = function(id) {
    return $(id);
  };
});
