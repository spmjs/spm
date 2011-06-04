// vim: set tabstop=2 shiftwidth=2:

var COLOR = {
  log: '37',
  info: '4;34',
  error: '41',
  warn: '0;33'
};

function createColorLogger(type, newLog) {
  global.console[type] = function() {
    var args = [].slice.call(arguments);
    args[0] = '\033[' + COLOR[type] + 'm' +
        '[' + type.toUpperCase() + ']\t' + args[0] + '\033[0m';
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
