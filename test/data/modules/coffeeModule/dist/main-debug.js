(function() {
    define("test/coffeeModule/0.9.1/m.coffee-debug", [ "$-debug", "gallery/underscore/1.4.2/underscore-debug", "arale/widget/1.0.2/widget-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports, module) {
        var $, Widget, _;
        $ = require("$-debug");
        _ = require("gallery/underscore/1.4.2/underscore-debug");
        Widget = require("arale/widget/1.0.2/widget-debug");
        return module.exports.say = function() {
            var output;
            return output = 10;
        };
    });
}).call(this);

define("test/coffeeModule/0.9.1/main-debug", [ "./m.coffee-debug", "$-debug", "gallery/underscore/1.4.2/underscore-debug", "arale/widget/1.0.2/widget-debug", "arale/base/1.0.1/base-debug", "arale/class/1.0.0/class-debug", "arale/events/1.0.0/events-debug" ], function(require, exports, module) {
    var m = require("./m.coffee-debug.js");
    m.say();
});