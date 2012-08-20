(function() {

  define("#coffeeModule/0.9.1/m.coffee-debug", ["$-debug", "#underscore/1.3.3/underscore-debug", "#widget/0.9.16/widget-debug", "#base/0.9.16/base-debug", "#class/0.9.2/class-debug", "#events/0.9.1/events-debug", "#base/0.9.16/aspect-debug", "#base/0.9.16/attribute-debug", "#jquery/1.7.2/jquery-debug", "#widget/0.9.16/daparser-debug", "#widget/0.9.16/auto-render-debug"], function(require, exports, module) {
    var $, Widget, _;
    $ = require('$-debug');
    _ = require('#underscore/1.3.3/underscore-debug');
    Widget = require('#widget/0.9.16/widget-debug');
    return module.exports.say = function() {
      var output;
      return output = 10;
    };
  });

}).call(this);


define("#coffeeModule/0.9.1/main-debug", ["./m.coffee.js-debug", "$-debug", "#underscore/1.3.3/underscore-debug", "#widget/0.9.16/widget-debug", "#base/0.9.16/base-debug", "#class/0.9.2/class-debug", "#events/0.9.1/events-debug", "#base/0.9.16/aspect-debug", "#base/0.9.16/attribute-debug", "#jquery/1.7.2/jquery-debug", "#widget/0.9.16/daparser-debug", "#widget/0.9.16/auto-render-debug"], function(require, exports, module) {
  var m = require('./m.coffee.js');
  m.say();
});
