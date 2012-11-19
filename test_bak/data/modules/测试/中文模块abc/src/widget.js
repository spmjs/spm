define(function(require, exports, module) {

    var Base = require('base');
    var $ = require('$');

    exports.say = function(id) {
      console.info($(id)); 
    };
});
