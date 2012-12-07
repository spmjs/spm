/*
 * Nested color logging support for terminal
 * @author: Hsiaoming Yang <lepture@me.com>
 * 
 * Thanks to: https://github.com/lepture/terminal
 *
 */

var util = require('util')
var os = require('os')
var color = require('./color')
var count = 0

var levels = {
  'debug': 10,
  'info': 20,
  'warn': 30,
  'error': 40,
  'log': 50
}

var colors = {
  'debug': color.grey,
  'info': color.green,
  'warn': color.yellow,
  'error':color.red 
}

function createLogText(context, level, args) {
  if (levels[context.level] > levels[level]) return

  var text = ''
  text += Array(count + 1).join('  ')
  if (count) {
    text += color.cyan('|-') + ' '
  }
  if (level === 'warn') {
    text += color.yellow_bg(' WARN ') + ' '
  } else if (level === 'error') {
    text += color.red_bg(' ERROR ') + ' '
  }
  var colorize = colors[level]
  if (colorize) {
    text += colorize(util.format.apply(context, args)) + os.EOL
  } else {
    text += util.format.apply(context, args) + os.EOL
  }
  return text;
}

var logging = {
  level: 'info',
  setlevel: function(obj) {
    if (obj.verbose) this.level = 'debug'
    if (obj.quiet) this.level = 'warn'
    if (obj in colors) {
      this.level = obj
    }
    return this
  },
  start: function() {
    if (levels[self.level] > 25) return;
    var text = ''
    text += Array(count + 1).join('  ')
    text += color.bold(util.format.apply(this, arguments)) + os.EOL
    process.stdout.write(text)
    count += 1
  },
  end: function() {
    if (levels[self.level] > 25) return;
    var text = ''
    text += Array(count + 1).join('  ')
    if (count) {
      text += color.cyan('*-') + ' '
    }
    text += util.format.apply(this, arguments) + os.EOL
    process.stdout.write(text)
    count -= 1
  },
  log: function() {
    text = createLogText(this, 'log', arguments)
    process.stdout.write(text)
  },
  debug: function() {
    text = createLogText(this, 'debug', arguments)
    process.stdout.write(text)
  },
  info: function() {
    text = createLogText(this, 'info', arguments)
    process.stdout.write(text)
  },
  warn: function() {
    text = createLogText(this, 'warn', arguments)
    process.stdout.write(text)
  },
  error: function() {
    text = createLogText(this, 'error', arguments)
    process.stderr.write(text)
  }
}

module.exports = logging
