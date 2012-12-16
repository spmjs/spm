var UglifyJS = require('uglify-js');
var path = require('path');

var fsExt = require('../../lib/utils/fs_ext.js');
var min = require('../../lib/compress/uglify.js');

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

  it('test ast parse speed', function() {
    console.time('test ast parse');
    var ast = getAst(astModule, 'src/jquery-debug.js');

    var find = false;
    var walker = new UglifyJS.TreeWalker(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
        find = true;
        return true;
      }
    });
    ast.walk(walker);

    console.info('find require--->', find);
    console.timeEnd('test ast parse');
  });

  it('test regexp parse speed', function() {
    var jqueryCode = fsExt.readFileSync(path.join(astModule, 'src/jquery-debug.js'));
    console.time('test regexp parse');
    console.info('find require ', /require\(/.test(jqueryCode));
    console.timeEnd('test regexp parse');
  });

  it('test replace ast_call node', function() {

    var ast = UglifyJS.parse('var c = seajs.importStyle(".a{color:#000;background:#fff}", "alice/a.css");');
    var seajsNode = null;
    var findImportStyle = new UglifyJS.TreeWalker(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'seajs') {
        seajsNode = node.clone();
        return true;
      }
    });

    ast.walk(findImportStyle);

    var ast2 = getAst(astModule, 'src/foo.js');

    var replace = new UglifyJS.TreeTransformer(function(node, descend) {
      if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
        //console.info(node);
        if (seajsNode) {
          return seajsNode.clone();
        }
        return node.clone();
      }
    });
    ast2.transform(replace);
    var code2 = ast2.print_to_string({beautify: true});
    code2.should.include('seajs.importStyle');
    code2.should.not.include('require(');
  });

  it('test code lint', function() {
    var filepath = path.join(astModule, 'src/code_check.js');
    min(filepath, function() {
      console.info('min succ');
    });

  });
});

function getAst(base, name) {
  var code = fsExt.readFileSync(path.join(base, name));
  return UglifyJS.parse(code, {
    filename : name, // default is null,
    comments: true
  });
}
