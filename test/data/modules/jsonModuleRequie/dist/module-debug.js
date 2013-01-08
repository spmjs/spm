define("test/sampleModule/0.0.1/jsonModule-debug", [], {
    rareWords: [ {
        spell: "a",
        words: [ "你", "好", "吗?" ]
    }, {
        spell: "b",
        words: [ "我", "很", "好?" ]
    }, {
        spell: "c",
        words: [ "他", "好", "吗?" ]
    }, {
        spell: "d",
        words: [ "他", "也", "好?" ]
    } ]
});

define("test/sampleModule/0.0.1/jsonModule2-debug", [], [ "a", "b", "c", "d" ]);

define("test/sampleModule/0.0.1/jsonModule3-debug", [], "foo bar");

define("test/sampleModule/0.0.1/module-debug", [ "./jsonModule-debug", "./jsonModule2-debug", "./jsonModule3-debug" ], function(require, exports) {
    // var a = require('a');
    // var b = require('b');
    // var c = require('c');
    var d = require("./jsonModule-debug.js");
    var e = require("./jsonModule2-debug.js");
    var f = require("./jsonModule3-debug.js");
    exports.get = function(id) {
        return $(id);
    };
});