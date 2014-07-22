define("b/1.1.0/src/b-debug", ["c/1.1.1/index-debug", "d/0.1.0/index-debug"], function(require, exports, module) {
  require("c/1.1.1/index-debug");
  require("b/1.1.0/src/b-debug.tpl");
});
define("b/1.1.0/src/b-debug.tpl", [], function(require, exports, module) {
  module.exports = '<div></div>';
});