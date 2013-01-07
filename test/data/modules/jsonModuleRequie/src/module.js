define(function(require, exports) {
  // var a = require('a');
  // var b = require('b');
  // var c = require('c');

  var d = require('./jsonModule.js');
  var e = require('./jsonModule2.js');
  var f = require('./jsonModule3.js');

  exports.get = function(id) {
    return $(id);
  };
});
