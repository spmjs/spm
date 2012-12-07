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

function log(context, level, args) {
  if (levels[context.level] > levels[level]) return

  var text = ''
  var stream = process.stdout
  text += Array(count + 1).join('  ')
  if (count) {
    text += color.cyan('|-') + ' '
  }
  if (level === 'warn') {
    text += color.yellow_bg(' WARN ') + ' '
  } else if (level === 'error') {
    text += color.red_bg(' ERROR ') + ' '
    stream = process.stderr
  }
  var colorize = colors[level]
  if (colorize) {
    text += colorize(util.format.apply(context, args)) + os.EOL
  } else {
    text += util.format.apply(context, args) + os.EOL
  }
  stream.write(text)
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
    if (levels[this.level] > 25) return;
    var text = ''
    text += Array(count + 1).join('  ')
    text += color.bold(util.format.apply(this, arguments)) + os.EOL
    process.stdout.write(text)
    count += 1
  },
  end: function() {
    if (levels[this.level] > 25) return;
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
    log(this, 'log', arguments)
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
