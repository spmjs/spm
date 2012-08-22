define("relativeModule/0.9.1/b-debug", [], function(require, exports){
  exports.say = function() {
    console.log('say!'); 
  };
});


define("relativeModule/0.9.1/core/a-debug", ["./b-debug"], function(require, exports) {
  var b = require('./b-debug');
  exports.say = function() {
    b.say();
  };
});
