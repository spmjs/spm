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

  it('test default name', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--root=test');
    cmd.push('--ver=1.1.0');
    var output = run(cmd);
    output.should.include('test/public/1.1.0/contact/model/m');
  });

  it('test arg version', function() {
    var cmd1 = baseCmd.slice(0);
    cmd1.push('--ver=release101');
    var output1= run(cmd1);
    output1.should.include('public/release101/contact/model/m');

    var cmd2 = baseCmd.slice(0);
    cmd2.push('--ver=release');
    var output2 = run(cmd2);
    output2.should.include('public/release/contact/model/m');

    var cmd3 = baseCmd.slice(0);
    cmd3.push('--ver=111');
    var output3 = run(cmd3);
    output3.should.include('public/111/contact/model/m');
  });

  it('test arg dist', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--ver=1.0.0');

    var cmd1 = cmd.slice(0);
    cmd1.push('--to=new_dist');
    var output1 = run(cmd1);
    output1.should.include('public/1.0.0/contact/model/m');
    fsExt.existsSync(path.join(basePath, 'new_dist')).should.be.true;

    var cmd2 = cmd.slice(0);
    cmd2.push('--to=111');
    var output2 = run(cmd2);
    output2.should.include('public/1.0.0/contact/model/m');
    fsExt.existsSync(path.join(basePath, '111')).should.be.true;
  });

  it('test arg output', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--output=main:\\".\\"');  
    cmd.push('--ver=1.0.0');
    cmd.push('--root=test');

    rm(path.join(basePath, 'dist'));
    run(cmd);

    fsExt.existsSync(path.join(basePath, 'dist', 'main-debug.js')).should.be.true;
    var code = cat(path.join('dist', 'main-debug.js'));

    code.should.include('test/public/1.0.0/core/js/config-debug');
    code.should.include('test/public/1.0.0/core/js/utils-debug');
    code.should.include('test/public/1.0.0/contact/model/m-debug');
    code.should.include('test/public/1.0.0/main-debug');
  });

  it('test with-debug', function() {
    var cmd = baseCmd.slice(0);
    cmd.push('--root=test');
    cmd.push('--name=public');
    cmd.push('--ver=1.0.0');
    cmd.push('--output=main:\\".\\"');  

    // test default
    var cmd1 = cmd.slice(0);
    var dist1 = 'debug_default';
    cmd1.push('--to=' + dist1);
    run(cmd1);
    var files1 = ls(dist1);

    files1.should.have.length(2);
    (files1.indexOf('main-debug.js') > -1).should.be.true;
    (files1.indexOf('main.js') > -1).should.be.true;

    var code1 = cat(path.join(dist1, 'main-debug.js'));
    code1.should.include('test/public/1.0.0/main-debug');
    
    var cmd2 = cmd.slice(0);
    var dist2 = 'debug_empty';
    cmd2.push('--to=' + dist2);
    cmd2.push('--with-debug=""');
    run(cmd2);
    var files2 = ls(dist2);

    files2.should.have.length(1);
    (files2.indexOf('main.js') > -1).should.be.true;

    var code2 = cat(path.join(dist2, 'main.js'));
    code2.should.include('test/public/1.0.0/main');

    var cmd3 = cmd.slice(0);
    var dist3 = 'debug_custom';
    cmd3.push('--to=' + dist3);
    cmd3.push('--with-debug=src');
    run(cmd3);
    var files3 = ls(dist3);
    
    files3.should.have.length(2);
    (files3.indexOf('main-src.js') > -1).should.be.true;
    (files3.indexOf('main.js') > -1).should.be.true;

    var code3 = cat(path.join(dist3, 'main-src.js'));
    code3.should.include('test/public/1.0.0/main-src');
  });
});

function run(cmd) {
  return exec(cmd.join(' '), {silent: false}).output;
}
