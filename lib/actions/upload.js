var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');

var Upload = ActionFactory.create('Upload');

Upload.MESSAGE = {

  USAGE: 'usage: spm upload [--only]',

  DESCRIPTION: 'upload a module to sources.'
};


util.inherits(Upload, Build);

module.exports = Upload;

