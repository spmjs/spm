// vim: set tabstop=2 shiftwidth=2:

var COLOR = {
  log: '37',
  info: '0;36',
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
    args[0] = colorize(args[0], type);
    global.console[type].apply(global.console, args);
  };
}

for (var i in global.console) {
  if (i in COLOR) {
    createColorLogger(i);
  } else {
    console[i] = global.console[i];
  }
}

exports.colorize = colorize;
