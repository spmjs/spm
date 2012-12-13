define( function (require, exports) {
  // var a =require('a');
  // var b= require('b');
  // var c=require('c');

  var a= require('./module.js');
  var b = require('./module.js');
  var c=require('./module.js');

  exports.get = function(id) {

    return $(id) + a + b + c;
  };
});

