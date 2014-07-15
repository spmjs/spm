define("a/1.0.0/index-debug", ["import-style/1.0.0/index-debug"], function(require, exports, module) {
  require("a/1.0.0/a-debug.css.js");
});
define("a/1.0.0/a-debug.css.js", ["import-style/1.0.0/index-debug"], function(require, exports, module) {
  require("import-style/1.0.0/index-debug")('ul{margin:0;}li{color:blue;}li{color:red;}body{background:none;}');
});
