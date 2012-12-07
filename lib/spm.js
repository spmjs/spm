var EventEmitter = require('events').EventEmitter
var version = require('../package').version

module.exports = new Spm(version)


// API for register command line tools
var program = require('./terminal/program')
Spm.prototype.registerCommand = program.registerExtension

var plugin = require('./core/plugin')
Spm.prototype.installPlugin = plugin.add
Spm.prototype.uninstallPlugin = plugin.remove


// plugins should use spm.logging
Spm.prototype.logging = require('./terminal/logging')


// plugins will use config info
Spm.prototype.config = require('./core/config').config


function Spm(version) {
  this.version = version
}

Spm.prototype.__proto__ = EventEmitter.prototype
