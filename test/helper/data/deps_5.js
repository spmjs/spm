(function(factory) {

  if (typeof define === 'function') {
    define('define8', ['a', 'b'], factory);
  } else {
    factory(null, (this['XX'] = {}));
  }

})(function(require, exports) {

  require('c');
  exports.version = '1.0.0';

});
