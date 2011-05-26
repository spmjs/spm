/**
 * @name backbone
 * @author jashkenas
 * @desc
 * Backbone supplies structure to JavaScript-heavy applications by providing models with key-value binding and custom events, collections with a rich API of enumerable functions, views with declarative event handling, and connects it all to your existing application over a RESTful JSON interface.
 * @url http://documentcloud.github.com/backbone/
 * @tags MVC framework
 * @version 0.3.3
 *
 * @src http://documentcloud.github.com/backbone/backbone.js
 * @min http://documentcloud.github.com/backbone/backbone-min.js
 */
define(function(require, exports, module) {

  var previousUnderscore = this._;
  var previousJQuery = this.jQuery;
  this._ = require('underscore');
  this.jQuery = require('jquery');

/*{{code}}*/

  this._ = previousUnderscore;
  this.jQuery = previousJQuery;
});
