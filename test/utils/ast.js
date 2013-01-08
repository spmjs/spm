var UglifyJS = require('uglify-js');
var path = require('path');

var Ast = require('../../lib/utils/ast.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var moduleHelp = require('../../lib/utils/module_help.js');

require('../module.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");
var sampleModule = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");
var jsonModule = path.join(path.dirname(module.filename), "../data/modules/jsonModuleRequie/");

describe('test require replace', function() {
  it('test replaceRequire method', function(done) {

    getProjectModel(astModule, function(model) {
      var modulePath = path.join(astModule, 'src/module.js');
      var slidePath = path.join(astModule, 'src/slide.js');
      var widgetPath = path.join(astModule, 'src/widget.js');

      var moduleCode = moduleHelp.filterRequire(model, fsExt.readFileSync(modulePath), '-debug');
      var slideCode = moduleHelp.filterRequire(model, fsExt.readFileSync(slidePath), '-debug');
      var widgetCode = moduleHelp.filterRequire(model, fsExt.readFileSync(widgetPath), '-debug');

      // console.info('moduleCode----', moduleCode); 
      // console.info('slideCode----', slideCode); 
      // console.info('widgetCode----', widgetCode); 

      // 注释不应被替换
      moduleCode.should.include('// var b = require(\'./a\');');
      moduleCode.should.include('var c = require(\'./c\');');
      moduleCode.should.include('var foo = require("./foo-debug.js");');

      // css 文件和模块部文件不应该替换.
      moduleCode.should.include('var alice = require("./a.css");');
      moduleCode.should.include('var tpl = require("./b.tpl");');

      slideCode.should.include('var module = require.async("./a0-debug.js");');
      slideCode.should.include('var Switchable = require("./switchable-debug.js");');
      slideCode.should.include('d = require("./f-debug");');
      slideCode.should.include('m1: require("./c-debug"),');
      slideCode.should.include('// require(\'./d\')');
      slideCode.should.include('m3: require.async("./a1-debug")');

      widgetCode.should.include('var Base = require("base-debug");');
      widgetCode.should.include('AutoRender = require("./auto-render-debug");');
      widgetCode.should.include('Widget.StaticsWhiteList = [ "autoRender" ];');

      done();
    });
  });

  it('test replace define', function() {
    var code1 = fsExt.readFileSync(jsonModule, 'src/jsonModule.js');
    var code2 = fsExt.readFileSync(jsonModule, 'src/jsonModule2.js');
    var code3 = fsExt.readFileSync(jsonModule, 'src/jsonModule3.js');

    Ast.replaceDefine(code1, 'id1', ['dep1', 'dep2']).should.include('define("id1", [ "dep1", "dep2" ], ');

    Ast.replaceDefine(code2, 'id2', ['dep1', 'dep2']).should.eql('define("id2", [ "dep1", "dep2" ], [ "a", "b", "c", "d" ]);');
    Ast.replaceDefine(code3, 'id3', ['dep1', 'dep2']).should.eql('define("id3", [ "dep1", "dep2" ], "foo bar");');
  });
});
