var UglifyJS = require('uglify-js');
var path = require('path');

var dependences = require('../../lib/utils/dependences.js');
var Ast = require('../../lib/utils/ast.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var moduleHelp = require('../../lib/utils/module_help.js');

require('../module.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");
var sampleModule = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");
var jsonModule = path.join(path.dirname(module.filename), "../data/modules/jsonModuleRequie/");

describe('test dependences', function() { 
  var ast, ast2, ast3;

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

  describe('test parse depedencies', function() {
    it('test parseStatic method', function() {
      //var deps = dependences.parseStatic(ast, 'arale/switchable/0.9.11/slide-debug');
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

    it('test parse json module dependncies', function() {
      var code3 = fsExt.readFileSync(astModule, 'src/jsonModule.js');
      var ast3 = dependences.getAst(code3);
      var deps = dependences.parse(ast3);
      deps.should.have.length(0);

      var code4 = fsExt.readFileSync(astModule, 'src/jsonModule1.js');
      var ast4 = dependences.getAst(code4);
      var deps = dependences.parse(ast4, 'ast_test/jsonModule');
      deps.should.have.length(0);

      var ast5 = getAst(jsonModule, 'dist/jsonModule2.js');
      var deps5 = dependences.parse(ast5, 'id');
      deps5.should.have.length(0);
    });

    it('test parse define', function() {
      var code = getCode(jsonModule, 'dist/module.js');
      var ids = dependences.parseDefine(code);

      ids.should.eql([ 'test/sampleModule/0.0.1/jsonModule',
        'test/sampleModule/0.0.1/jsonModule2',
        'test/sampleModule/0.0.1/jsonModule3',
        'test/sampleModule/0.0.1/module' ]);
    });
  });

  describe('test define check', function() {
    it('should has define', function() {
      var code = getCode(astModule, 'src/foo.js');
      dependences.hasDefine(code, true).should.eql(true);
    });

    it('should not contain define', function() {
      var code = getCode(astModule, 'src/foo1.js');
      dependences.hasDefine(code, true).should.eql(false);
    });
  });
});

function getAst(dir, name) {
  return dependences.getAst(getCode(dir, name));
}

function getCode(dir, name) {
  return fsExt.readFileSync(dir, name);
}
