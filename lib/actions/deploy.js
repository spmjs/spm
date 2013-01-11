var ActionFactory = require('../core/action_factory.js');
var Commander = require('../utils/commander.js');

var Deploy = ActionFactory.create('deploy', 'build');

Deploy.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('部署一个 cmd 模块');

  opts.on('--help', function() {
    console.info();
    console.info('  ' + 'Examples:'.bold.blue);
    console.info();
    console.info('   ' + opts.description());
    console.info();
    console.info('   $ ' + 'spm deloy'.magenta);
    console.info();
    console.info('   部署模块到指定目录');
    console.info();
    console.info('   $ ' + 'spm deploy'.magenta + ' ' + '--to=='.cyan + '../public');
    console.info();
    console.info('   指定 deploy 中的相应的配置，进行部署');
    console.info();
    console.info('   $ ' + 'spm deploy'.magenta + ' ' + '--to=='.cyan + 'hole12');
    console.info();
    console.info('   查看更多的部署信息: ' + 'https://github.com/spmjs/spm/wiki/spm-deploy'.underline);
    console.info();
  });
};

module.exports = Deploy;
