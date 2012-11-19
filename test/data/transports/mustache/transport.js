/**
 * @package mustache_package.json
 *
 * @version 0.4.0
 * @src ../../../modules/mustache/0.4.0/mustache-debug.js
 */

(function(factory) {

  if (typeof define === 'function') {
    define('#{{id}}', [], factory);
  }
  else if (typeof module !== 'undefined') {
    module.exports = factory();
  }
  else {
    this.Mustache = factory();
  }

})(function() {

/*{{code}}*/
return Mustache;
});
