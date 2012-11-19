define(function(require, exports, module) {
  var m = require('../model/m.js');
  var v = require('../render/v.js');

  exports.get = function() {
    return v.show(m); 
  };

  exports.getData = function() {
  
  }
});
