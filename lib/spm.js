var EventEmitter = require('events').EventEmitter;
var version = require('../package').version;

exports = module.exports = new EventEmitter();

exports.version = version;


// API for register command line tools
var extensions = [];
var program = require('colorful').program;
exports.registerCommand = function(name, executable, description) {
  var cmd = new program.Command(name, executable, description);
  extensions.push(cmd);
  return cmd;
};
exports.extensionCommands = function() {
  return extensions;
};

var plugin = require('./plugin');
exports.installPlugin = plugin.install;
exports.uninstallPlugin = plugin.uninstall;

// plugins will use config info
exports.config = require('./config').config;

// plugins should use spm.logging
exports.logging = require('colorful').logging;


// register sdk
exports.ast = require('./sdk/ast');
exports.iduri = require('./sdk/iduri');
