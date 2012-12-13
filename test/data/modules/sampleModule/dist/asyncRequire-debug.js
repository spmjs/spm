define("test/sampleModule/0.0.1/asyncRequire-debug", [], function(require, exports) {
    var m1 = require.async("./module-debug.js");
    var m2 = require.async("module.js-debug");
    var m3 = require.async("$-debug");
    var m4 = require.async("arale/base/1.0.1/base-debug");
    exports.say = function() {
        m1.get();
        m2.get();
    };
});