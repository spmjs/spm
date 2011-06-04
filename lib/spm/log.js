// vim: set tabstop=2 shiftwidth=2:

var COLOR = {
  log: '37',
  info: '0;32',
  error: '41',
  warn: '0;33'
};

function colorize(text, color) {
  return '\033[' + COLOR[color] + 'm' + text + '\033[0m';
}

function createColorLogger(type, newLog) {
  global.console[type] = function() {
    var args = [].slice.call(arguments);
    args[0] = colorize('[' + type.toUpperCase() + ']\t' + args[0], type);
    newLog.apply(global.console, args);
  };
}

var error = global.console.error;
var warn = global.console.warn;
var log = global.console.log;
var info = global.console.info;

createColorLogger('log', log);
createColorLogger('info', info);
createColorLogger('warn', warn);
createColorLogger('error', error);

exports.colorize = colorize;
