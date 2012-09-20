// spm build 相关命令行参数测试集合. 
// https://github.com/seajs/spm/issues/284

require('shelljs/global');

var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spmHome = path.join(path.dirname(module.filename), '../../', 'bin', 'spm');

var basePath = path.join(path.dirname(module.filename), "../data/modules/noconfig/");

cd(basePath);

var baseCmd = [];
baseCmd.push('node ' + spmHome + ' build');
baseCmd.push('--global-config=' + path.join('public', 'config', 'seajs.config'));
baseCmd.push('--src=public');
//baseCmd.push('--version=1111');  
//baseCmd.push('--dist=222');
//baseCmd.push('--output.main=.');  

describe('spm cmd build test', function() {

  it('test arg name', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--name=name');
    cmd.push('--version=1.0.0');
    var output = run(cmd);
    expect(output).toMatch('#name/1.0.0/contact/model/m');
  });

  it('test default name', function() {
    var cmd = baseCmd.slice(0);

    cmd.push('--version=1.0.0');
    var output = run(cmd);
    expect(output).toMatch('#public/1.0.0/contact/model/m');
  });

  it('test arg version', function() {
    var cmd1 = baseCmd.slice(0);
    cmd1.push('--version=release101');
    var output1= run(cmd1);
    expect(output1).toMatch('#public/release101/contact/model/m');

    var cmd2 = baseCmd.slice(0);
    cmd2.push('--version=release');
    var output2 = run(cmd2);
    expect(output2).toMatch('#public/release/contact/model/m');

    var cmd3 = baseCmd.slice(0);
    cmd3.push('--version=111');
    var output2 = run(cmd3);
    expect(output2).toMatch('#public/111/contact/model/m');
  });

  it('test arg dist', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--version=1.0.0');

    var cmd1 = cmd.slice(0);
    cmd1.push('--dist=new_dist');
    var output1 = run(cmd1);
    expect(output1).toMatch('#public/1.0.0/contact/model/m');
    expect(fsExt.existsSync(path.join(basePath, 'new_dist'))).toBeTruthy();

    var cmd2 = cmd.slice(0);
    cmd2.push('--dist=111');
    var output2 = run(cmd2);
    expect(output2).toMatch('#public/1.0.0/contact/model/m');
    expect(fsExt.existsSync(path.join(basePath, '111'))).toBeTruthy();
  });

  it('test arg output', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--output.main=.');  
    cmd.push('--version=1.0.0');

    rm(path.join(basePath, 'dist'));
    run(cmd);

    expect(fsExt.existsSync(path.join(basePath, 'dist', 'main-debug.js'))).toBeTruthy();
    var code = cat(path.join('dist', 'main-debug.js'));

    expect(code).toMatch('#public/1.0.0/core/js/config-debug');
    expect(code).toMatch('"#public/1.0.0/core/js/utils-debug"');
    expect(code).toMatch('#public/1.0.0/contact/model/m-debug');
    expect(code).toMatch('#public/1.0.0/main-debug');
  });
});

function run(cmd) {
  return exec(cmd.join(' '), {silent: false}).output;
}
