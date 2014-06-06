define("a/1.0.0/index-debug", ["a/1.0.0/relative-debug", "d/0.1.1/index-debug", "d/0.1.0/index-debug", "c/1.1.1/index-debug", "b/1.1.0/src/b-debug"], function(require, exports, module) {
  require("a/1.0.0/relative-debug");
  require("d/0.1.1/index-debug");
});
define("a/1.0.0/relative-debug", ["d/0.1.0/index-debug", "c/1.1.1/index-debug", "b/1.1.0/src/b-debug"], function(require, exports, module) {
  console.log('relative');
  require("b/1.1.0/src/b-debug");
});
