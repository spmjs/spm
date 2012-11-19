define("test/module/1.0.0/a-debug", [], function(require, exports) {
  exports.say = function() {
    console.info('hi, im a.');
  };
});

define("test/module/1.0.0/b-debug", [], function(require, exports) {
  exports.say = function() {
    console.info('hi, im b.');
  };
});


define("test/module/1.0.0/c-debug", [], function(require, exports) {
  exports.say = function() {
    console.info('hi, im c.');
  };
});


define("test/module/1.0.0/module-debug", ["./a-debug", "./b.js-debug", "./c.js#-debug"], function(require, exports) {
  var a = require('./a-debug');
  var b = require('./b-debug.js');
  var c = require('./c-debug.js#');
  exports.say = function() {
    console.info('hi, im main module.');
    a.say();
    b.say();
    c.say();
  };
});
