define("a/1.0.0/index-debug", ["a/1.0.0/relative-debug", "d/0.1.1/index-debug", "b"], function(require, exports, module) {
  require("a/1.0.0/relative-debug");
  require("d/0.1.1/index-debug");
});
define("a/1.0.0/relative-debug", ["b"], function(require, exports, module) {
  console.log('relative');
  require("b");
});
define("d/0.1.1/index-debug", [], function(require, exports, module) {
  exports.d = function() {
    console.log('0.1.1');
  };
});
