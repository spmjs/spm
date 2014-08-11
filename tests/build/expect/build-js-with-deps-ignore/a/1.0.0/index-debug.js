define("a/1.0.0/index-debug", ["b/1.1.0/src/b-debug", "c", "d", "d/0.1.1/index-debug"], function(require, exports, module) {
  require("a/1.0.0/relative-debug");
  require("d/0.1.1/index-debug");
});
define("a/1.0.0/relative-debug", ["b/1.1.0/src/b-debug", "c", "d"], function(require, exports, module) {
  console.log('relative');
  require("b/1.1.0/src/b-debug");
});