define("a/1.0.0/index-debug", ["a/1.0.0/a-debug.css"], function (require, exports, module) {
  require("a/1.0.0/a-debug.css");

});
define("a/1.0.0/a-debug.css", [], function (require, exports, module) {
  seajs.importStyle('ul{margin:0}li{color:red}body{background:0 0}');
});
