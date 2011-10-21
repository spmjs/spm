/**
 * @package https://raw.github.com/janl/mustache.js/master/lib/package.json
 *
 * @version 0.4.0
 * @src https://raw.github.com/janl/mustache.js/master/mustache.js
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
