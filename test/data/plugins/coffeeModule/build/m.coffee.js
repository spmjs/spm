(function() {

  define(function(require, exports, module) {
    var $, Widget, _;
    $ = require('$');
    _ = require('underscore');
    Widget = require('widget');
    return module.exports.say = function() {
      var output;
      return output = 10;
    };
  });

}).call(this);
