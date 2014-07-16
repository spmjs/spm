define("a/0.1.0/src/a-debug", [], function(require, exports, module) {
  require("a/0.1.0/src/b.c.d-debug");
});
define("a/0.1.0/src/b.c.d-debug", [], function(require, exports, module) {
  console.log('b.c.d');
});
