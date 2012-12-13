define("test/sampleModule/0.0.1/module-debug", [], function(require, exports) {
    // var a = require('a');
    // var b = require('b');
    // var c = require('c');
    exports.get = function(id) {
        return $(id);
    };
});