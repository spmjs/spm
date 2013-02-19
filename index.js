var util = require('util');
var EventEmitter = require('events').EventEmitter;
util.inherits(module.exports, EventEmitter);

exports = module.exports;
exports.version = require('./package').version;

exports.plugin = require('./lib/plugin');
exports.config = require('./lib/config');

exports.install = require('./lib/install');
exports.info = require('./lib/info');
exports.publish = require('./lib/publish');
exports.search = require('./lib/search');

exports.build = require('./lib/build');

// plugins should use spm.log
exports.log = require('./lib/utils/log');

// register sdk
exports.sdk = {};
exports.sdk.ast = require('cmd-util').ast;
exports.sdk.iduri = require('./lib/sdk/iduri');
exports.sdk.spmrc = require('./lib/sdk/spmrc');
exports.sdk.yuan = require('./lib/sdk/yuan');
exports.sdk.grunt = require('./lib/sdk/grunt');
