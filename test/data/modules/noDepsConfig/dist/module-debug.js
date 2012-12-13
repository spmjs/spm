define("test/noDepsConfig/0.0.1/module-debug", [ "$-debug" ], function(require, exports) {
    var $ = require("$-debug");
    exports.get = function(id) {
        return $(id);
    };
});