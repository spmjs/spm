/**
 * @package https://raw.github.com/documentcloud/backbone/master/package.json
 *
 * @src http://documentcloud.github.com/backbone/backbone.js
 * @min http://documentcloud.github.com/backbone/backbone-min.js
 */

(function(factory) {

  if (typeof define === 'function') {
    define('#{{id}}', ['underscore', 'jquery'], factory);
  }
  else if (typeof exports !== 'undefined') {
    factory(require, exports);
  }
  else {
    factory();
  }

})(function(require, exports) {

  var previousUnderscore = this._;
  var previousJQuery = this.jQuery;
  this._ = require('underscore');
  this.jQuery = require('jquery');

/*{{code}}*/

  this._ = previousUnderscore;
  this.jQuery = previousJQuery;
});
