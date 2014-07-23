define("a/0.1.0/output-debug", ["b/0.1.0/index-debug", "c/0.1.1/index-debug", "c/0.1.0/index-debug"], function(require, exports, module) {
  require("b/0.1.0/index-debug");
  require("c/0.1.0/index-debug");
});