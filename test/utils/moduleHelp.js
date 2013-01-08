var should = require('should');
var path = require('path');
var help = require('../../lib/utils/module_help.js');
var env = require('../../lib/utils/env.js');

describe('moduleHelp', function() {
  var j1 = 'lib/a.js';
  var j2 = '../core/b.js';
  var j3 = './core/b.js';
  var j4 = './c.js';
  var j5 = './c.js.css';
  var j6 = './c.js#';

  var c1 = 'lib/a.css';
  var c2 = '../core/b.css';
  var c3 = './core/b.css';
  var c4 = './c.css';
  var c5 = './c.css.js';

  var m1 = 'jquery';
  var m2 = '$';
  var m3 = '_';
  var m4 = 'a.js';
  var m5 = 'a/b/c/';
  var m6 = 'a/b.js';
  
  it('js module check', function() {
    help.isJs(j1).should.be.true;
    help.isJs(j2).should.be.true;
    help.isJs(j3).should.be.true;
    help.isJs(j4).should.be.true;
    help.isJs(j5).should.be.false;
    help.isJs(j6).should.be.true;
  });

  it('css module check', function() {
    help.isCss(c1).should.be.true;
    help.isCss(c2).should.be.true;
    help.isCss(c3).should.be.true;
    help.isCss(c4).should.be.true;
    help.isCss(c5).should.be.false;
  });

  it('relative module check', function() {
    help.isRelative(j1).should.be.false;    
    help.isRelative(j2).should.be.true;    
    help.isRelative(j3).should.be.true;    

    help.isRelative(c1).should.be.false;    
    help.isRelative(c2).should.be.true;    
    help.isRelative(c3).should.be.true;    

    help.isRelative(m1).should.be.false;    
    help.isRelative(m2).should.be.false;    
    help.isRelative(m3).should.be.false;    
    help.isRelative(m4).should.be.false;    
    help.isRelative(m5).should.be.false;    
    help.isRelative(m6).should.be.false;
  });

  it('relative module support base', function() {
    var name = 'config.json';
    var base = path.join(env.home, '.spm');

    help.isRelative(name).should.be.false;
    help.isRelative(name, base).should.be.true;
    help.isRelative('a.js', base).should.be.false;
  });

// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
  var n1 = './a';
  var n2 = './a.b';
  var n3 = './a.b.js';
  var n4 = '$';
  var n5 = '_';
  var n6 = 'a.tpl';
  var n7 = 'a.b#';

  var n8 = './js/module';
  var n9 = 'js/a/b.js';

  it('module normalize test', function() {
    help.normalize(j1).should.eql(j1);
    help.normalize(j2).should.eql(j2);
    help.normalize(j3).should.eql(j3);
    help.normalize(j4).should.eql(j4);
    help.normalize(c1).should.eql(c1);
    help.normalize(c2).should.eql(c2);
    help.normalize(c3).should.eql(c3);
    
    help.normalize(n1).should.eql('./a.js');
    help.normalize(n2).should.eql('./a.b.js');
    help.normalize(n3).should.eql(n3);
    help.normalize(n4).should.eql(n4);
    help.normalize(n5).should.eql(n5);
    help.normalize(n6).should.eql(n6);
    help.normalize(n7).should.eql(n7);
    help.normalize(n8).should.eql(n8 + '.js');
    help.normalize(n9).should.eql(n9);
  });

  it('module unique ', function() {
    var arr = ['a/b/c', 'b/c', 'a/b/c'];
    help.unique(arr).should.eql(['a/b/c', 'b/c']);
  });

  it('module is local path', function() {
    var l1 = './a';
    var l2 = '.';
    var l3 = '~/user';
    var l4 = module.filename;
    var l5 = 'www.gogole.com';
    var l6 = 'http://www.baidu.com';

    help.isLocalPath(l1).should.be.false;
    help.isLocalPath(l2).should.be.true;
    help.isLocalPath(l3).should.be.true;
    help.isLocalPath(l4).should.be.true;
    help.isLocalPath(l5).should.be.false;
    help.isLocalPath(l6).should.be.false;
  });

  it('perfect local path', function() {
    var l1 = './a';
    var l2 = '.';
    var l3 = '~/user';
    var l4 = module.filename;
    var l5 = 'www.gogole.com';
    var l6 = 'http://www.baidu.com';

    var base = process.cwd();
    var home = env.home;
    help.perfectLocalPath(l1).should.eql(l1);
    help.perfectLocalPath(l2).should.eql(base);
    help.perfectLocalPath(l3).should.eql(path.join(home, 'user'));
    help.perfectLocalPath(l4).should.eql(l4);
    help.perfectLocalPath(l5).should.eql(l5);
    help.perfectLocalPath(l6).should.eql(l6);
  });

  it('get host', function() {
    var h1 = 'modules.spmjs.org';
    var h2 = 'http://modules.seajs.org';
    var h3 = 'http://aralejs.org:7000';

    help.getHost(h1).should.eql(h1);
    help.getHost(h2).should.eql('modules.seajs.org');
    help.getHost(h3).should.eql('aralejs.org-7000');
  });

  it('module getBaseDepModulePath', function() {
    var m0 = 'a.js';
    var m00 = './a.js';
    var m1 = 'lib/a.js';
    var m2 = './core/b.js';
    var m3 = './lib/a/c.js';
    var m4 = '../core/b.js'

    var m5 = '../tpl/a.tpl';

    var m7 = '/js/a.js';
    var m8 = './js/b.js';

    help.getBaseDepModulePath(m0, m2).should.eql(m2);
    help.getBaseDepModulePath(m00, m2).should.eql(m2);
    help.getBaseDepModulePath(m0, m1).should.eql('./lib/a.js');

    help.getBaseDepModulePath(m1, m2).should.eql('./lib/core/b.js');
    help.getBaseDepModulePath(m2, m3).should.eql('./core/lib/a/c.js');
    help.getBaseDepModulePath(m3, m4).should.eql('./lib/core/b.js');
    help.getBaseDepModulePath(m1, m4).should.eql('./core/b.js');

    help.getBaseDepModulePath(m1, m5).should.eql('./tpl/a.tpl');

    //help.getBaseDepModulePath(m0, m8).should.eql(m8);
    //help.getBaseDepModulePath(m0, m7).should.eql(m7);
    //help.getBaseDepModulePath(m0, m00).should.eql(m00);
    //help.getBaseDepModulePath(m8, m7).should.eql(m7);
  });

  it('module getRelativeBaseModulePath', function() {
    var m0 = 'a.js';
    var m00 = './a.js';

    var m1 = './lib/a.js';
    var m2 = './core/b.js';
    var m3 = './lib/a/c.js';

    help.getRelativeBaseModulePath(m1, m2).should.eql('../core/b.js');
    help.getRelativeBaseModulePath(m1, m3).should.eql('./a/c.js');
    help.getRelativeBaseModulePath(m2, m3).should.eql('../lib/a/c.js');
    
    help.getRelativeBaseModulePath(m0, m1).should.eql(m1);
    help.getRelativeBaseModulePath(m00, m1).should.eql(m1);
  });

  it('get base module', function() {

    var D = '-debug';

    var m0 = 'a.js';
    var m00 = './a.js';

    var m1 = './lib/a.js';
    var m2 = './lib/a/c.js#';

    var m3 = './a/b.tpl';

    var m4 = './a.css';

    var m5 = './b';
    var m6 = 'jquery';

    // 不是相对模块不进行处理.
    help.getBaseModule(m0).should.eql('a');
    help.getDebugModule(m0, D).should.eql('a-debug.js');
    help.getBaseModule(m00).should.eql('./a');
    help.getDebugModule(m00, D).should.eql('./a-debug.js');

    help.getBaseModule(m1).should.eql('./lib/a');
    help.getDebugModule(m1, D).should.eql('./lib/a-debug.js');

    help.getBaseModule(m3).should.eql('./a/b.tpl');
    help.getDebugModule(m3, D).should.eql('./a/b.tpl');

    help.getBaseModule(m4).should.eql('./a.css');
    help.getDebugModule(m4, D).should.eql('./a-debug.css');

    help.getDebugModule(m5, D).should.eql('./b-debug');
    help.getDebugModule(m6, D).should.eql('jquery-debug');

    help.getBaseModule(m5).should.eql(m5);
    help.getBaseModule(m6).should.eql(m6);
  });

  it('version check', function() {
    var v1 = '1.0.0';
    var v2 = '1.0.0-dev';
    var v3 = '1.0';
    var v4 = '1.0-dev';
    var v5 = 'release';

    help.isVersion(v1).should.be.true;
    help.isVersion(v2).should.be.true;
    help.isVersion(v3).should.be.false;
    help.isVersion(v4).should.be.false;
    help.isVersion(v5).should.be.false;
  });
  
  it('contain version check', function() {
    var v1 = 'gallery/jquery/1.0.0/jquery';
    var v2 = 'gallery/jquery';

    help.containVersion(v1).should.be.true;
    help.containVersion(v2).should.be.false;
  });

  it('get latest version', function() {
    var vs1 = {'1.0.0': 1, '1.0.1': 2, '1.0.2-dev': 3};
    var vs2 = {'1.1.0': 1, '1.2.1': 2, '1.1.10': 3};
    var vs3 = {'1.2.0': 1, '1.4.1': 2, '2.0.0': 3};

    help.getLatestVersion(vs1).should.eql('1.0.2-dev');
    help.getLatestVersion(vs2).should.eql('1.2.1');
    help.getLatestVersion(vs3).should.eql('2.0.0');
  });

  it('module id Parse', function() {
    var id1 = 'gallery/jquery/1.8.3/jquery';
    var id2 = 'arale/widget/1.0.2/widget';
    var id3 = 'seajs/1.3.0/seajs';
    var id4 = 'a/b';

    var idObj1 = help.moduleIdParse(id1);
    var idObj2 = help.moduleIdParse(id2);
    var idObj3 = help.moduleIdParse(id3);
    var idObj4 = help.moduleIdParse(id4);

    idObj1.moduleId.should.eql(id1);
    idObj1.moduleName.should.eql('jquery');
    idObj1.version.should.eql('1.8.3');

    idObj2.moduleId.should.eql(id2);
    idObj2.moduleName.should.eql('widget');
    idObj2.version.should.eql('1.0.2');

    idObj3.moduleId.should.eql(id3);
    idObj3.moduleName.should.eql('seajs');
    idObj3.version.should.eql('1.3.0');
    
    should.not.exist(idObj4);
  });

  // var defaultIdRule = '{{root}}/{{name}}/{{version}}/{{moduleName}}';
  it('generate module id', function() {
    var o1 = {
      root: 'gallery',
      name: 'jquery',
      version: '1.8.3',
      moduleName: 'jquery'
    };

    var o2 = {
      root: '',
      name: 'seajs',
      version: '1.3.0',
      moduleName: 'seajs'
    };

    help.generateModuleId(o1).should.eql('gallery/jquery/1.8.3/jquery');
    help.generateModuleId(o2).should.eql('seajs/1.3.0/seajs');

    help.generateModuleId('{{name}}/{{version}}', o1).should.eql('jquery/1.8.3');
  });

  it('filterIdAndDeps', function() {
    var code = 'define(function(require, exports) {\n console.info(\'a\')});'
    var id = 'arale/widget/1.0.2/widget';
    var deps = ['arale/base/1.0.1/base', './templatable.js'];

    var cmdCode = 'define("arale/widget/1.0.2/widget", [ "arale/base/1.0.1/base", "./templatable.js" ], function(require, exports) {\n    console.info("a");\n});'
      
    help.filterIdAndDeps(code, id, deps).should.eql(cmdCode);
  });

  it('filterRequire', function() {

  });

  it('getDepModule', function() {

  });

  it('globMods', function() {

  });
});
