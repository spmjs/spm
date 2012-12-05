
// API for register command line tools
var program = require('./terminal/program')
exports.registerCommand = program.registerExtension

var plugin = require('./util/plugin')
exports.installPlugin = plugin.install
exports.uninstallPlugin = plugin.uninstall
