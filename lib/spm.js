var EventEmitter = require('events').EventEmitter;
var version = require('../package').version;

exports = module.exports = new EventEmitter();

exports.version = version;

exports.plugin = require('./plugin');
exports.config = require('./config');

exports.install = require('./install').run;
exports.publish = require('./publish').run;
exports.build = require('./build').run;

// plugins should use spm.log
exports.log = require('./utils/log');

// register sdk
exports.sdk = {};
exports.sdk.ast = require('cmd-util').ast;
exports.sdk.iduri = require('./sdk/iduri');
exports.sdk.spmrc = require('./sdk/spmrc');
exports.sdk.yuan = require('./sdk/yuan');
exports.sdk.grunt = require('./sdk/grunt');
