define("test/outputTest/0.0.1/a-debug", [], function(require, exports) {
    exports.getA = function(id) {};
});

define("test/outputTest/0.0.1/b-debug", [], function(require, exports) {
    exports.getB = function(id) {};
});

define("test/outputTest/0.0.1/c-debug", [], function(require, exports) {
    exports.getC = function(id) {};
});

define("test/outputTest/0.0.1/localMerge-debug", [ "./a-debug", "./b-debug", "./c-debug", "gallery/jquery/1.7.2/jquery-debug", "arale/widget/1.0.2/widget-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports) {
    var $ = require("gallery/jquery/1.7.2/jquery-debug");
    var widget = require("arale/widget/1.0.2/widget-debug");
    var moduleA = require("./a-debug.js");
    var moduleB = require("./b-debug.js");
    var modulec = require("./c-debug.js");
    exports.get = function(id) {
        var dom = $(id);
        widget.render(dom, module);
    };
});