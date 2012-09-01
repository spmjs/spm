define("sampleModule/0.0.1/spaceRequire-debug", ["./module.js-debug", "a-debug", "b-debug", "c-debug"], function (require, exports) {
  var a =require('a-debug');
  var b= require('b-debug');
  var c=require('c-debug');

  var c= require('./module.js-debug');
  var c = require('./module.js-debug');
  var c=require('./module.js-debug');

  exports.get = function(id) {
    return $(id);
  };
});

