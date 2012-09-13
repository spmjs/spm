define("test1/module/0.0.1/spaceRequire-debug", ["./module-debug"], function (require, exports) {
  // var a =require('undefined-debug');
  // var b= require('undefined-debug');
  // var c=require('undefined-debug');

  var c= require('./module-debug');
  var c = require('./module-debug');
  var c=require('./module-debug');

  exports.get = function(id) {
    return $(id);
  };
});

