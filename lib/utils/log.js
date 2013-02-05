var util = require('util');
var color = require('colorful').color;

module.exports = log = {};

var levels = {
  debug: 1,
  info: 2,
  start: 2,
  end: 2,
  warn: 3,
  error: 4
};

log.quiet = false;

log.level = 'info';

log.log = function(level, msg) {
  if (levels[level] >= levels[log.level] && log.quiet === false) {
    if (console[level]) {
      console[level](msg);
    } else {
      console.log(msg);
    }
  }
};

log.debug = function() {
  var category = arguments[0];
  var args = Array.prototype.slice.call(arguments).slice(1);
  var msg = util.format.apply(this, args);

  log.log('debug', getMsg(category, msg, color.blue));
};


log.info = function() {
  var category = arguments[0];
  var args = Array.prototype.slice.call(arguments).slice(1);
  var msg = util.format.apply(this, args);

  log.log('info', getMsg(category, msg, color.cyan));
};

log.warn = function() {
  var category = arguments[0];
  var args = Array.prototype.slice.call(arguments).slice(1);
  var msg = util.format.apply(this, args);

  log.log('warn', getMsg(category, msg, color.yellow));
};

log.error = function() {
  var category = arguments[0];
  var args = Array.prototype.slice.call(arguments).slice(1);
  var msg = util.format.apply(this, args);

  log.log('error', getMsg(category, msg, color.red));
};

log.config = function(options) {
  if (options.verbose) {
    log.level = 'debug';
  }
  if (options.quiet) {
    log.level = 'warn';
  }
};


function getMsg(category, msg, fn) {
  var w = 15;
  var len = Math.max(0, w - category.length);
  var pad = new Array(len + 1).join(' ');
  msg = pad + fn(category) + ': ' + color.grey(msg);
  return msg;
}
