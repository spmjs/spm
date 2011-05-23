/**
 * @name jquery
 * @author John Resig
 * @desc jquery is a new kind of JavaScript Library.
 * @url http://jquery.com/
 *
 * @tags dom,event
 *
 * @src http://code.jquery.com/jquery-1.6.1.js
 * @min http://code.jquery.com/jquery-1.6.1.min.js
 */
define(function(require, exports, module) {
    'code';
    try {
        delete window.jQuery;
        delete window.$;
    } catch (e) {}
    exports.$ = jQuery;
    exports.version = $.jquery;
});
