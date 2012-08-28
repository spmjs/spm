var util = require('util');
var ActionFactory = require('../core/action_factory.js');
var Opts = require('../utils/opts');

var Deploy = ActionFactory.create('deploy', 'build');

Deploy.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('DEPLOY CMD MODULE \nusage: spm deploy [options]');
  opts.extend(Opts.get('build'));
}

module.exports = Deploy;
