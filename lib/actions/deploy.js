var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');

var Deploy = ActionFactory.create('Deploy');

Deploy.MESSAGE = {

  USAGE: 'usage: spm deploy[--only]',

  DESCRIPTION: 'deploy a module to server.'
};


util.inherits(Deploy, Build);

module.exports = Deploy;
