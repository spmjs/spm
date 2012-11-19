define("test1/module/0.0.1/asyncRequire-debug", [], function(require, exports) {
  var m1 = require.async('./module-debug');
  var m2 = require.async('module-debug');
  var m3 = require.async('$-debug');
  var m4 = require.async('#base/1.0.0/base-debug');

  exports.say = function() {
    m1.get();
    m2.get();
  };
});
