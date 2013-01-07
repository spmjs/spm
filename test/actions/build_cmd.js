// spm build 相关命令行参数测试集合. 
// https://github.com/seajs/spm/issues/284

require('should');
require('shelljs/global');
require('../module.js');

var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spmHome = path.join(path.dirname(module.filename), '../../', 'bin', 'spm');

var basePath = path.join(path.dirname(module.filename), "../data/modules/noconfig/");

cd(basePath);

var baseCmd = [];
baseCmd.push('node ' + spmHome + ' build');
baseCmd.push('--global-config=' + path.join('public', 'config', 'seajs.config'));
baseCmd.push('--src=public');
//baseCmd.push('--ver=1111');  
//baseCmd.push('--to=222');
//baseCmd.push('--output.main=.');  

describe('spm cmd build', function() {

  it('test arg name', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--name=name');
    cmd.push('--ver=1.0.0');
    cmd.push('--root=test');
    var output = run(cmd);
    output.should.include('test/name/1.0.0/contact/model/m');
  });

 });

function run(cmd) {
console.info('---->', cmd.join(' '))
  return exec(cmd.join(' '), {silent: false}).output;
}
