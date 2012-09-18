define("#你好/0.0.1/widget-debug", ["#base/0.9.16/base-debug", "#events/0.9.1/events-debug", "#class/0.9.2/class-debug", "$-debug"], function(require, exports, module) {

    var Base = require('#base/0.9.16/base-debug');
    var $ = require('$-debug');

    exports.say = function(id) {
      console.info($(id)); 
    };
});
