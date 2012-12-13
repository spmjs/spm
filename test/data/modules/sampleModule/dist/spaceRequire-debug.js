define("test/sampleModule/0.0.1/spaceRequire-debug", [ "./module-debug" ], function(require, exports) {
    // var a =require('a');
    // var b= require('b');
    // var c=require('c');
    var a = require("./module-debug.js");
    var b = require("./module-debug.js");
    var c = require("./module-debug.js");
    exports.get = function(id) {
        return $(id) + a + b + c;
    };
});