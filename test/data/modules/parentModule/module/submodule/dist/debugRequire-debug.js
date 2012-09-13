define("test1/module/0.0.1/module-debug", [], function(require, exports) {
  // var a = require('a-debug');
  // var b = require('b-debug');
  // var c = require('c-debug');
  // var $ = require('$-debug');

  exports.get = function(id) {
    return $(id);
  };
});


define("test1/module/0.0.1/debugRequire-debug", ["./module-debug", "$b-debug"], function(require, exports) {
  var m1 = require('./module-debug');
  var m2 = require('module-debug');

  var a = require('$b-debug');

  exports.say = function() {
    m1.get();
    m2.get();
  };
});
