/*
 * Nested color logging support for terminal
 * @author: Hsiaoming Yang <lepture@me.com>
 * 
 * Thanks to: https://github.com/lepture/terminal
 *
 */

var util = require('util')
var color = require('./color')
var count = 0

var levels = {
  'debug': 10,
  'info': 20,
  'warn': 30,
  'error': 40
}

var colors = {
  'debug': color.grey,
  'info': color.green,
  'warn': color.yellow,
  'error':color.red 
}

function log(context, level, args) {
  if (levels[context.level] > levels[level]) return

  var text = ''
  for (var i = 0; i < count; i++) {
    text += '  '
  }
  if (count) {
    text += color.cyan('|-') + ' '
  }
  var colorize = colors[level]
  text += colorize(util.format.apply(context, args)) + '\n'
  if (levels[level] > 20) {
    process.stderr.write(text)
  } else {
    process.stdout.write(text)
  }
}

var logging = {
  level: 'info',
  start: function() {
    var text = ''
    for (var i = 0; i < count; i++) {
      text += '  '
    }
    text += color.bold(util.format.apply(this, arguments)) + '\n'
    process.stdout.write(text)
    count += 1
  },
  end: function() {
    var text = ''
    for (var i = 0; i < count; i++) {
      text += '  '
    }
    if (count) {
      text += color.cyan('*-') + ' '
    }
    text += util.format.apply(this, arguments) + '\n'
    process.stdout.write(text)
    count -= 1
  },
  debug: function() {
    log(this, 'debug', arguments)
  },
  info: function() {
    log(this, 'info', arguments)
  },
  warn: function() {
    log(this, 'warn', arguments)
  },
  error: function() {
    log(this, 'error', arguments)
  }
}

module.exports = logging
