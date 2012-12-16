var UglifyJS = require('uglify-js');
var path = require('path');

var dependences = require('../../lib/utils/dependences.js');
var ast = require('../../lib/utils/ast.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var moduleHelp = require('../../lib/utils/module_help.js');

require('../module.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");
var sampleModule = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");

describe('test dependences', function() { 
  var ast, ast2;

  beforeEach(function() {
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    ast = UglifyJS.parse(code, {
        filename : "slide.js" // default is null
    });

    var code2 = fsExt.readFileSync(sampleModule, 'src/asyncRequire.js');

    ast2 = UglifyJS.parse(code2, {
        filename : "asyncRequire.js" // default is null
    });
    
  });

  it('test parseStatic method', function() {
    var deps = dependences.parseStatic(ast);
    deps.should.eql([ './switchable-debug', '$-debug', 'arale/easing/1.0.0/easing-debug' ]);
  });

  it('test parseDynamic method', function() {
    var deps = dependences.parseDynamic(ast);
    deps.should.eql([ './switchable-debug', './f', './c', './b' ]);

    var deps2 = dependences.parseDynamic(ast2);
    deps2.should.have.length(0);

    var code = fsExt.readFileSync(astModule, 'src/config.js');
    var ast3 = UglifyJS.parse(code);

    var deps3 = dependences.parse(ast3);

    deps3.should.have.length(0);

    var code4 = fsExt.readFileSync(astModule, 'src/widget.js');
    var ast4 = UglifyJS.parse(code4);
    var deps4 = dependences.parse(ast4);
    deps4.should.eql([ 'base', '$', './daparser', './auto-render' ]);
  });

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
});
