/**
 * @package ./backbone_package.json
 *
 * @src ../../../modules/backbone/0.5.3/backbone-debug.js
 * @min ../../../modules/backbone/0.5.3/backbone.js
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
