var fs = require('fs')
var path = require('path')
var os = require('os')
var child_process = require('child_process')

exports.safeWrite = function(filepath) {
  var dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

exports.spawn = function(command, args, options) {
  if (os.type() === 'Windows_NT') {
    spawn = function(command, args, options) {
      args = ['/c', command].concat(args)
      command = 'cmd'
    }
  }
  return child_process.spawn(command, args, options)
}
