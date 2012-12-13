define("arale/switchable/0.9.11/slide-debug", ["./switchable-debug", "$-debug", "arale/easing/1.0.0/easing-debug"], function(require, exports, module) {
    var Switchable = require('./switchable-debug');

    // 卡盘轮播组件
    exports.a = Switchable.extend({
        attrs: {
            autoplay: true,
            circular: true
        }
    });

    var d;
    (function() {
      d = require('./f'); 
    }());
    // require('./e');
    exports.b = (function() {
      return {
        m1: require('./c'), // require('./d')
        m2: require('./b')
      } 
    })();

});
