var UglifyJS = require('uglify-js');
var path = require('path');

var dependences = require('../../lib/utils/dependences.js');
var fsExt = require('../../lib/utils/fs_ext.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");
describe('test dependences', function() { 
  var ast;
  beforeEach(function() {
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    ast = UglifyJS.parse(code, {
        filename : "slide.js" // default is null
    });
  });

  it('test parseStatic method', function() {
    var deps = dependences._parseStatic(ast);
    deps.should.eql([ 'arale/switchable/0.9.11/slide-debug',
  './switchable-debug', '$-debug', 'arale/easing/1.0.0/easing-debug' ]);
  });

  it('test parseDynamic method', function() {
    var deps = dependences._parseDynamic(ast);
    deps.should.eql([ './switchable-debug', './c', './b' ]);
  });

  it('test replaceRequire method', function() {
  
  });
});
