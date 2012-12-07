var EventEmitter = require('events').EventEmitter
var version = require('../package').version

module.exports = new Spm(version)


// API for register command line tools
var extensions = []
var program = require('./terminal/program')
Spm.prototype.registerCommand = function(name, executable, description) {
  var cmd = new program.Command(name, executable, description)
  extensions.push(cmd)
  return cmd
}
Spm.prototype.extensionCommands = function() {
  return extensions;
}

var plugin = require('./system/plugin')
Spm.prototype.installPlugin = plugin.add
Spm.prototype.uninstallPlugin = plugin.remove

// plugins will use config info
Spm.prototype.config = require('./system/config').config

// plugins should use spm.logging
Spm.prototype.logging = require('./terminal/logging')


function Spm(version) {
  this.version = version
}

Spm.prototype.__proto__ = EventEmitter.prototype
