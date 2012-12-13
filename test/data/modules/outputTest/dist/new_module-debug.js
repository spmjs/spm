define("test/outputTest/0.0.1/a-debug", [], function(require, exports) {
    exports.getA = function(id) {};
});

define("test/outputTest/0.0.1/b-debug", [], function(require, exports) {
    exports.getB = function(id) {};
});

define("test/outputTest/0.0.1/a-debug", [], function(require, exports) {
    exports.getA = function(id) {};
});

define("test/outputTest/0.0.1/b-debug", [], function(require, exports) {
    exports.getB = function(id) {};
});

define("test/outputTest/0.0.1/c-debug", [], function(require, exports) {
    exports.getC = function(id) {};
});

define("test/outputTest/0.0.1/plugins/p1-debug", [], function(require, exports) {});

define("test/outputTest/0.0.1/allMerge-debug", [ "./a-debug", "./b-debug", "./c-debug", "./plugins/p1-debug", "./plugins/p2-debug", "gallery/jquery/1.7.2/jquery-debug", "arale/widget/1.0.2/widget-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports) {
    var $ = require("gallery/jquery/1.7.2/jquery-debug");
    var widget = require("arale/widget/1.0.2/widget-debug");
    var moduleA = require("./a-debug");
    var moduleB = require("./b-debug");
    var modulec = require("./c-debug");
    var p1 = require("./plugins/p1-debug");
    var p2 = require("./plugins/p2-debug");
    exports.get = function(id) {
        var dom = $(id);
        widget.render(dom, module);
    };
});

define("test/outputTest/0.0.1/c-debug", [], function(require, exports) {
    exports.getC = function(id) {};
});