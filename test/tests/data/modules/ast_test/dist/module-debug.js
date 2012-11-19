define("#ast_test/0.0.1/foo-debug", [], function(require, exports) {
  exports.say = function() {
    console.info('hello!');
  };
});


// comment1
// var b = require('./a-debug');
// var c = require('./b-debug');

/**
 * var c = require('./c-debug');
 */
define("#ast_test/0.0.1/module-debug", ["./foo-debug"], function(require, exports) {
  var foo = require('./foo-debug');
  exports.say = function() {
    foo.say();  // var c = require('./d-debug');
  };
});
