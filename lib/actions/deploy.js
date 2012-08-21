var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');
var Opts = require('../utils/opts');

var Deploy = ActionFactory.create('Deploy');
util.inherits(Deploy, Build);

var opts = Deploy.opts; 
opts.help('DEPLOY CMD MODULE \nusage: spm deploy [options]');
opts.extend(Opts.get('build'));

module.exports = Deploy;
