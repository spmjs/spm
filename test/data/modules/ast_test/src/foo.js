define(function(require, exports) {
  var b = seajs.importStyle('abc', 'def');
  exports.say = function() {
    console.info('hello!');
  };
});
