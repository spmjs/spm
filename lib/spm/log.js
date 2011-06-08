// vim: set tabstop=2 shiftwidth=2:

var COLOR = {
  log: '37',
  info: '0;32',
  error: '41',
  warn: '0;33'
};

var console = exports;

function colorize(text, color) {
  return '\033[' + COLOR[color] + 'm' + text + '\033[0m';
}

function createColorLogger(type) {
  console[type] = function() {
    var args = [].slice.call(arguments);
    args[0] = colorize('[' + type.toUpperCase() + ']\t' + args[0], type);
    global.console[type].apply(global.console, args);
  };
}

var error = global.console.error;
var warn = global.console.warn;
var log = global.console.log;
var info = global.console.info;

for (var i in global.console) {
  if (i in COLOR) {
    createColorLogger(i);
  } else {
    console[i] = global.console[i];
  }
}

exports.colorize = colorize;
