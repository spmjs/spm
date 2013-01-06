var ActionFactory = require('../core/action_factory.js');
var Commander = require('../utils/commander.js');

var Deploy = ActionFactory.create('deploy', 'build');

Deploy.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('deploy a cmd module.');
  opts.option('--to <dir>', 'set local deployment directory.');
};

module.exports = Deploy;
