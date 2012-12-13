define("#tplModule/1.0.0/a-debug", [], function(require, exports, module) {
    //var a = require('./a.html');
    var b1 = "<div class=\"div\" name='abc'>tpl</div>";
    var b2 = require.async("./c.htm");
    //var c = require('./c.htm');
    exports.say = function() {
        console.info("a---->", a);
    };
});