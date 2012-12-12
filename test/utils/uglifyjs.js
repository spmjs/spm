var UglifyJS = require('uglify-js');
var path = require('path');

var fsExt = require('../../lib/utils/fs_ext.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");

describe('uglify-js ', function() {
  it('test parse define args', function() {
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    var ast = UglifyJS.parse(code, {
        filename : "slide.js" // default is null
    });

    var call_expression = null;
    var walker = new UglifyJS.TreeWalker(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
console.info('isTopLevel--->', node instanceof UglifyJS.AST_Toplevel);
        var temp = call_expression;
        call_expression = node;
        descend();
        call_expression = temp;
        return true;
      }

      if (node instanceof UglifyJS.AST_Lambda) {
        var tmp = call_expression;
        call_expression = null;
        descend();
        call_expression = tmp;
        return true;
      }

      if (node instanceof UglifyJS.AST_Array && call_expression) {
        descend();
        return true;
        console.info('---->', node.start, node.end)
      }
      if (node instanceof UglifyJS.AST_String && call_expression) {
        console.log("Found string: %s at %d,%d", node.getValue(),
                    node.start.line, node.start.col);
      }
    });
    ast.walk(walker);
  });

  it('test require', function() {
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    var ast = UglifyJS.parse(code, {
        filename : "slide.js" // default is null
    });

    var call_expression = null;
    var walker = new UglifyJS.TreeWalker(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
        var temp = call_expression;
        call_expression = node;
        descend();
        call_expression = temp;
        return true;
      }
      if (node instanceof UglifyJS.AST_Lambda) {
        var tmp = call_expression;
        call_expression = null;
        descend();
        call_expression = tmp;
        return true;
      }

      if (node instanceof UglifyJS.AST_String && call_expression) {
        console.log("Found string: %s at %d,%d", node.getValue(),
                    node.start.line, node.start.col);
      }
    });
    ast.walk(walker);
  });

  it('test replace require content', function() {
  
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    var ast = UglifyJS.parse(code, {
        filename : "slide.js" // default is null
    });

    var call_expression = null;
    var replace = new UglifyJS.TreeTransformer(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
        var temp = call_expression;
        call_expression = node;
        descend(node, this);
        call_expression = temp;
        return true;
      }
      if (node instanceof UglifyJS.AST_Lambda) {
        var tmp = call_expression;
        call_expression = null;
        descend(node, this);
        call_expression = tmp;
        return true;
      }

      if (node instanceof UglifyJS.AST_String && call_expression) {
        return new UglifyJS.AST_String({
          start: node.start,
          end: node.end,
          value: node.getValue() + '-debug'
        });
      }
    });

    var ast2 = ast.transform(replace);
    //console.info('---->', ast2.print_to_string({beautify: true}));
  });
});
