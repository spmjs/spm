define("#tplModule/1.0.0/a-debug", [], function(require, exports, module) {
    //var a = '<div>html</div>';
    var b = "<div class=\"div\" name='abc'>tpl</div>";
    //var c = '<div>htm</div>';
    exports.say = function() {
        console.info("a---->", a);
    };
});