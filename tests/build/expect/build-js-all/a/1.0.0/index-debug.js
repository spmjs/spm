define("a/1.0.0/index-debug", ["a/1.0.0/relative-debug", "d/0.1.0/index-debug", "c/1.1.1/index-debug", "b/1.1.0/src/b-debug", "d/0.1.1/index-debug"], function (require, exports, module) {
  require("a/1.0.0/relative-debug");
  require("d/0.1.1/index-debug");

});
define("a/1.0.0/relative-debug", ["d/0.1.0/index-debug", "c/1.1.1/index-debug", "b/1.1.0/src/b-debug"], function (require, exports, module) {
  console.log('relative');
  require("b/1.1.0/src/b-debug");

});
define("b/1.1.0/src/b-debug", ["d/0.1.0/index-debug", "c/1.1.1/index-debug", "b/1.1.0/src/b-debug.tpl"], function (require, exports, module) {
  require("c/1.1.1/index-debug");
  require("b/1.1.0/src/b-debug.tpl");

});
define("c/1.1.1/index-debug", ["d/0.1.0/index-debug"], function (require, exports, module) {
  require("d/0.1.0/index-debug");

});
define("d/0.1.0/index-debug", [], function (require, exports, module) {
  exports.d = function () {
    console.log('0.1.0');
  };

});
define("b/1.1.0/src/b-debug.tpl", [], function (require, exports, module) {
  module.exports = '<div></div>';
});
define("d/0.1.1/index-debug", [], function (require, exports, module) {
  exports.d = function () {
    console.log('0.1.1');
  };

});
