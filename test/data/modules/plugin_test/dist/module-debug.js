define("test/test_plugin/0.0.1/module-debug", [], function(require, exports) {
    exports.say = function() {
        console.info("hi");
    };
});