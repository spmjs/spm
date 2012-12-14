define("test/public/1.0.0/contact/model/m-src", [ "../../core/js/config-src", "../../core/js/utils-src" ], function(require, exports, module) {
    var tpl = '<div>hello</div>\n<input name="nihai" value=\'{"name": "a"}\'/>';
    var config = require("../../core/js/config-src.js");
    var utils = require("../../core/js/utils-src.js");
    exports.say = function() {
        utils.log("tpl----->" + tpl);
        utils.log("config--->", config);
    };
});

define("test/public/1.0.0/core/js/config-src", [], {
    name: "config",
    version: "1.0"
});

define("test/public/1.0.0/core/js/utils-src", [], function(require, exports) {
    exports.log = function(str) {
        console.info("[log] " + str);
    };
});

define("test/public/1.0.0/main-src", [ "./contact/model/m-src", "./core/js/config-src", "./core/js/utils-src", "gallery/jquery/1.7.2/jquery-src", "arale/base/1.0.1/base-src", "arale/class/1.0.0/class-src", "arale/events/1.0.0/events-src" ], function(require, exports, module) {
    var m = require("./contact/model/m-src.js");
    var $ = require("gallery/jquery/1.7.2/jquery-src");
    var base = require("arale/base/1.0.1/base-src");
    exports.say = function(id) {
        m.say();
        console.info($(id));
        console.info(base);
    };
});