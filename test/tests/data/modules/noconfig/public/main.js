define(function(require, exports, module) {
  var m = require('./contact/model/m.js');
  var $ = require('$');
  var base = require('base');

  exports.say = function(id) {
    m.say();
    console.info($(id));
    console.info(base);
  };
});
