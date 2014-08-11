define("b/1.1.0/src/b-debug", ["c", "d"], function(require, exports, module) {
  require('c');
  require("b/1.1.0/src/b-debug.tpl");
});
define("b/1.1.0/src/b-debug.tpl", [], function(require, exports, module) {
  module.exports = '<div></div>';
});