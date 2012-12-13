var UglifyJS = require('uglify-js');
var path = require('path');

var dependences = require('../../lib/utils/dependences.js');
var fsExt = require('../../lib/utils/fs_ext.js');

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
    var deps = dependences._parseStatic(ast);
    deps.should.eql([ './switchable-debug', '$-debug', 'arale/easing/1.0.0/easing-debug' ]);
  });

  it('test parseDynamic method', function() {
    var deps = dependences._parseDynamic(ast);
    deps.should.eql([ './switchable-debug', './f', './c', './b' ]);

    var deps2 = dependences._parseDynamic(ast2);
    deps2.should.have.length(0);

    var code = fsExt.readFileSync(astModule, 'src/config.js');
    var ast3 = UglifyJS.parse(code);

    var deps3 = dependences.parse(ast3);

    deps3.should.have.length(0);

    var code4 = fsExt.readFileSync(astModule, 'src/widget.js');
    var ast4 = UglifyJS.parse(code4);
    var deps4 = dependences.parse(ast4);
  });

  it('test replaceRequire method', function() {
  
  });
});
