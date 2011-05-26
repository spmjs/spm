/**
 * @name jquery
 * @author John Resig
 * @desc jQuery is a new kind of JavaScript Library.
 * @url http://jquery.com/
 * @tags dom,event
 * @version 1.6.1
 *
 * @src http://code.jquery.com/jquery-1.6.1.js
 * @min http://code.jquery.com/jquery-1.6.1.min.js
 */
define(function(require, exports, module) {

/*{{code}}*/

  module.exports = $.noConflict(true);
  exports.version = $.jquery;
});
