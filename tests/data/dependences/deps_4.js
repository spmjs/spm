(function(factory) {

  if (typeof define === 'function') {
    define([], factory);
  } else {
    factory(null, (this['XX'] = {}));
  }

})(function(require, exports) {

  require('a');
  exports.version = '1.0.0';

});
