define("test/public/1.0.0/contact/model/m-debug", [ "../../core/js/config-debug", "../../core/js/utils-debug" ], function(require, exports, module) {
    var tpl = '<div>hello</div>\n<input name="nihai" value=\'{"name": "a"}\'/>';
    var config = require("../../core/js/config-debug.js");
    var utils = require("../../core/js/utils-debug.js");
    exports.say = function() {
        utils.log("tpl----->" + tpl);
        utils.log("config--->", config);
    };
});

define("test/public/1.0.0/core/js/config-debug", [], {
    name: "config",
    version: "1.0"
});

define("test/public/1.0.0/core/js/utils-debug", [], function(require, exports) {
    exports.log = function(str) {
        console.info("[log] " + str);
    };
});

define("test/public/1.0.0/main-debug", [ "./contact/model/m-debug", "./core/js/config-debug", "./core/js/utils-debug", "gallery/jquery/1.7.2/jquery-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports, module) {
    var m = require("./contact/model/m-debug.js");
    var $ = require("gallery/jquery/1.7.2/jquery-debug");
    var base = require("arale/base/1.0.1/base-debug");
    exports.say = function(id) {
        m.say();
        console.info($(id));
        console.info(base);
    };
});