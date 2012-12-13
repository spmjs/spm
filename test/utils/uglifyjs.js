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
        // console.info('---->', node.start, node.end)
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
        filename : "slide.js", // default is null,
        comments: true
    });

    var call_expression = null;
    var replace = new UglifyJS.TreeTransformer(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
        node = node.clone();
        var temp = call_expression;
        call_expression = node;
        descend(node, this);
        call_expression = temp;
        return node;
      }
      if (node instanceof UglifyJS.AST_Lambda) {
        var tmp = call_expression;
        call_expression = null;
        descend(node, this);
        call_expression = tmp;
        return node;
      }

      if (node instanceof UglifyJS.AST_String && call_expression) {
        return new UglifyJS.AST_String({
          start: node.start,
          end: node.end,
          value: node.getValue() + '-debug'
        });
      }
      return node.clone();
    });

    var ast2 = ast.transform(replace);
    //console.info('--new-->', ast2.print_to_string({beautify: true, comments: true}));
    //console.info('--old-->', ast.print_to_string({beautify: true, comments: true}));
  });

  it('test clone', function() {
    var code = fsExt.readFileSync(astModule, 'dist/slide-debug.js');
    
    // optionally you can pass another argument with options:
    var ast = UglifyJS.parse(code, {
        filename : "slide.js", // default is null,
        comments: true
    });

    // this is the transformer
    var deep_clone = new UglifyJS.TreeTransformer(function(node, descend){
        node = node.clone();
        // the descend function expects two arguments:
        // the node to dive into, and the tree walker
        // `this` here is the tree walker (=== deep_clone).
        // by descending into the *cloned* node, we keep the original intact
        descend(node, this);
        return node;
    });
    
    // in ast2 we'll get a deep copy of ast
    var ast2 = ast.transform(deep_clone);
    
    // let's change AST now:
    
    //console.log('clone---1-->', ast.print_to_string({ beautify: true, comments: true}));
    //console.log('clone---2-->', ast2.print_to_string({ beautify: true, comments: true}));
  });
});
