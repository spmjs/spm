var EventEmitter = require('events').EventEmitter;
var version = require('../package').version;

exports = module.exports = new EventEmitter();

exports.version = version;

exports.plugin = require('./plugin');
exports.config = require('./config');

exports.publish = require('./publish').run;
exports.build = require('./build').run;

// plugins should use spm.logging
exports.logging = require('colorful').logging;


// register sdk
exports.sdk = {};
exports.sdk.ast = require('./sdk/ast');
exports.sdk.iduri = require('./sdk/iduri');
exports.sdk.transform = require('./sdk/transform').transform;
exports.sdk.concat = require('./sdk/concat').concat;
