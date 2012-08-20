var util = require('util');
var Build = require('./build.js');
var ActionFactory = require('./action_factory.js');

var Opts = require('../utils/opts.js');
var opts = Opts.get('deploy', 'DEPLOY CMD MODULE: Usage: spm deploy:');

var Deploy = ActionFactory.create('Deploy');

util.inherits(Deploy, Build);
opts.extend(Opts.get('build'));

module.exports = Deploy;
