var util = require('util');
var EventEmitter = require('events').EventEmitter;
util.inherits(module.exports, EventEmitter);
exports = module.exports;
exports.version = require('./package').version;

exports.client = require('./lib/client');
exports.config = require('./lib/config');
exports.upload = require('./lib/upload');
exports.build = require('./lib/build');
exports.doc = require('./lib/doc');
exports.test = require('./lib/test');

// plugins should use spm.log
exports.log = require('./lib/utils/log');
exports.run = require('./lib/utils/run');
exports.print = require('./lib/utils/print');

// register sdk
exports.sdk = {};
exports.sdk.iduri = require('./lib/sdk/iduri');
exports.sdk.yuan = require('./lib/sdk/yuan');
exports.sdk.file = require('./lib/sdk/file');
exports.sdk.module = require('./lib/sdk/module');
exports.sdk.git = require('./lib/sdk/git');
