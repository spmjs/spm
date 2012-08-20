var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');

var Opts = require('../utils/opts.js');
var opts = Opts.get('upload', 'upload a module to sources.: Usage: spm upload:');
var Upload = ActionFactory.create('Upload');

util.inherits(Upload, Build);
opts.extend(Opts.get('build'));

module.exports = Upload;

