define("./program",["./biz/increment"],function(a){var b=a("./biz/increment").increment;console.log("The result of inc(1) is",b(1))});
define("./biz/increment",["math"],function(a,b){var c=a("math").add;b.increment=function(a){return c(a,1)}});
define("math",[],function(a,b){b.add=function(){var a=0,b=0,c=arguments.length;while(b<c)a+=arguments[b++];return a},console.log("I am math in lib2")});