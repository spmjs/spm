var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');
var Opts = require('../utils/opts');

var Upload = ActionFactory.create('Upload');
util.inherits(Upload, Build);

var opts = Upload.opts;
opts.help('upload a module to sources.\nusage: spm upload [options]');
opts.extend(Opts.get('build'));

module.exports = Upload;
