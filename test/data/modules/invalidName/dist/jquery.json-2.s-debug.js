define("test/invalidNameModule/0.0.1/jquery.json-2.s-debug", [ "$-debug" ], function(require, exports) {
    var $ = require("$-debug");
    exports.get = function(id) {
        return $(id);
    };
});