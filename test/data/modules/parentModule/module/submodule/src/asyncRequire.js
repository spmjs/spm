define(function(require, exports) {
  var m1 = require.async('./module.js');
  var m2 = require.async('module.js');
  var m3 = require.async('$');
  var m4 = require.async('base');

  exports.say = function() {
    m1.get();
    m2.get();
  };
});
