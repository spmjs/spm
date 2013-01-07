var ActionFactory = require('../core/action_factory.js');
var Commander = require('../utils/commander.js');

var Deploy = ActionFactory.create('deploy', 'build');

Deploy.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('部署一个 cmd 模块');
};

module.exports = Deploy;
