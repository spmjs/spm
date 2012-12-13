define("test/sampleModule/0.0.1/module-debug", [], function(require, exports) {
    // var a = require('a');
    // var b = require('b');
    // var c = require('c');
    exports.get = function(id) {
        return $(id);
    };
});

define("test/sampleModule/0.0.1/debugRequire-debug", [ "./module-debug" ], function(require, exports) {
    var m1 = require("./module-debug.js");
    var m2 = require("./module-debug");
    exports.say = function() {
        m1.get();
        m2.get();
    };
});