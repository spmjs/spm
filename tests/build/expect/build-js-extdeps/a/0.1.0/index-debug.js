define("a/0.1.0/index-debug", ["import-style/1.0.0/index-debug"], function(require, exports, module) {
  require("a/0.1.0/a-debug.css.js");
  alert(1);
});
define("a/0.1.0/a-debug.css.js", ["import-style/1.0.0/index-debug"], function(require, exports, module) {
  require("import-style/1.0.0/index-debug")('a{color:red;}');
});