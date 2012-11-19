define("sampleModule/0.0.1/module-debug", [], function(require, exports) {
  // var a = require('a-debug');
  // var b = require('b-debug');
  // var c = require('c-debug');

  exports.get = function(id) {
    return $(id);
  };
});

define("sampleModule/0.0.1/debugRequire-debug", ["./module-debug"], function(require, exports) {
  var m1 = require('./module-debug');
  var m2 = require('module-debug');

  exports.say = function() {
    m1.get();
    m2.get();
  };
});
