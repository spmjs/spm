
define(function(require, exports, module) {

    // Calendar is designed for desktop, we don't need to consider ``zepto``.
    var $ = require('$');
    var moment = require('moment');
    var Overlay = require('overlay');
    var Templatable = require('templatable');
    var lang = require('./i18n/{{locale}}/lang')
    var lang = require('./i18n/{{locale}}/lang.js')

    var template = require('./calendar.tpl');
    var CalendarModel = require('./model');
});
