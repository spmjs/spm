define("#cycling/0.0.1/model/m-debug", [], function(require, exports, module) {

  exports.get = function() {
     return '1111';
  };
});



define("#cycling/0.0.1/render/v-debug", ["../controller/c-debug"], function(require, exports, module) {
  var c = require('../controller/c-debug'); 

  exports.show = function(m) {
    m = c.getData(m);
    return render(m);
  };

  function render() {
  
  }
});



define("#cycling/0.0.1/controller/c-debug", ["../model/m-debug", "../render/v-debug"], function(require, exports, module) {
  var m = require('../model/m-debug');
  var v = require('../render/v-debug');

  exports.get = function() {
    return v.show(m); 
  };

  exports.getData = function() {
  
  }
});
