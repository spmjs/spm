// spm build 相关命令行参数测试集合. 
// https://github.com/seajs/spm/issues/284

require('shelljs/global');

var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spmHome = path.join(path.dirname(module.filename), '../../', 'bin', 'spm');

var basePath = path.join(path.dirname(module.filename), "../data/modules/noconfig/");


var baseCmd = [];
baseCmd.push('node ' + spmHome + ' build');
baseCmd.push('--src=' + path.join(basePath, 'public'))
baseCmd.push('--global-config=' + path.join(basePath, 'public', 'config', 'seajs.config'));
baseCmd.push('--name=public');  
baseCmd.push('--version=1111');  
baseCmd.push('--dist=' + path.join(basePath, '111'));  
baseCmd.push('--output.main=.');  

describe('spm cmd build test', function() {
  console.info('---------', spmHome);
  var cmd = baseCmd.splice(0);

  run(cmd);
});

function run(cmd) {
  var output = exec(cmd.join(' '), {slient: true}).output;
}



