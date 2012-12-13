define(function(require, exports, module) {
    var Switchable = require('./switchable.js');

    var module = require.async('./a0.js');

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
        m2: require('./b'),
        m3: require.async('./a1')
      } 
    })();

});
