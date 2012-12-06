/*
 * Color supports in terminal
 * @author: Hsiaoming Yang <lepture@me.com>
 * 
 * Thanks to: https://github.com/lepture/terminal
 *
 */

var tty = require('tty')
var codes = {}

function isColorSupported() {
  // support for child process
  // if (!tty.isatty()) return false;

  if ('COLORTERM' in process.env) return true;

  var term = process.env['TERM'].toLowerCase()
  if (term.indexOf('color') != -1) return true;
  return term === 'xterm' || term === 'linux'
}

function esc(code) {
  return '\x1b[' + code + 'm'
}

function colorize(name, text) {
  if (!isColorSupported()) {
    return text
  }
  var code = codes[name]
  if (!code) {
    return text
  }
  return code[0] + text + code[1]
}

function createColorFunc(name) {
  // exports here
  exports[name] = function(text) {
    return colorize(name, text)
  }
}

var styles = {
  bold: [1, 22],
  italic: [3, 23],
  underline: [4, 24],
  blink: [5, 25],
  inverse: [7, 27],
  strike: [9, 29]
}

for (var name in styles) {
  var code = styles[name]
  codes[name] = [esc(code[0]), esc(code[1])]
}

var colors = [
  'black', 'red', 'green', 'yellow', 'blue',
  'magenta', 'cyan', 'white'
]

for (var i = 0; i < colors.length; i++) {
  codes[colors[i]] = [esc(i + 30), esc(39)]
  codes[colors[i] + '_bg'] = [esc(i + 40), esc(49)]
}

codes['gray'] = codes['grey'] = [esc(90), esc(39)]
codes['gray_bg'] = codes['grey_bg'] = [esc(40), esc(49)]

for (var name in codes) {
  // this is exports
  createColorFunc(name)
}
