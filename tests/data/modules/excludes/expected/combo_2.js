define("http://test.com/js/program.js",["./a","lib-x","lib-z"],function(a){var b=a("./a");console.log(b.name),a("lib-x"),a("lib-z")});
define("http://test.com/js/a.js",[],{name:"a"});
define("lib-z",[],{name:"z"});