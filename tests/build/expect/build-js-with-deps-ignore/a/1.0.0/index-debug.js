define("a/1.0.0/index-debug", ["b/1.1.0/src/b-debug", "c", "d", "b/1.1.0/src/extra-debug", "d/0.1.1/index-debug"], function(require, exports, module) {
  require("a/1.0.0/relative-debug");
  require("d/0.1.1/index-debug");
});
define("a/1.0.0/relative-debug", ["b/1.1.0/src/b-debug", "c", "d", "b/1.1.0/src/extra-debug"], function(require, exports, module) {
  console.log('relative');
  require("b/1.1.0/src/b-debug");
  require("b/1.1.0/src/extra-debug");
});