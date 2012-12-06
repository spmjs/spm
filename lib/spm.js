
// API for register command line tools
var program = require('./terminal/program')
exports.registerCommand = program.registerExtension

var plugin = require('./core/plugin')
exports.installPlugin = plugin.add
exports.uninstallPlugin = plugin.remove


// plugins should use spm.logging
exports.logging = require('./terminal/logging')
