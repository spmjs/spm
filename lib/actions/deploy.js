var util = require('util');
var ActionFactory = require('../core/action_factory.js');
var Opts = require('../utils/opts');

var Deploy = ActionFactory.create('deploy', 'build');

Deploy.prototype.registerArgs = function() {
  Deploy.super_.prototype.registerArgs.call(this);
  var opts = this.opts;
  opts.help('DEPLOY CMD MODULE.');
  opts.extend(Opts.get('build'));
  opts.add('to', 'set local deployment directory.');
  opts.type('to', 'string');
};

module.exports = Deploy;
