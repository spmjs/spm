var UglifyJS = require('uglify-js');
var path = require('path');

var fsExt = require('../../lib/utils/fs_ext.js');
var min = require('../../lib/compress/uglify.js');

var astModule = path.join(path.dirname(module.filename), "../data/modules/ast_test/");

describe.skip('uglify-js ', function() {
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

describe('uglifyjs use', function() {
  var c1 = 'function sum1(x, y){ return x + y }';
  var c2 = 'function sum1(x, y){ if (DEBUG) {return x + y} else return 3 }';
  var c3 = 'function sum3(x, y){ if (!DEBUG) {return x + y} else return 2; }';

  it.skip('test toplevel ast', function() {
    var ast = null;

    ast = UglifyJS.parse(c1, {toplevel:ast});
    ast = UglifyJS.parse(c2, {toplevel:ast});
    ast = UglifyJS.parse(c3, {toplevel:ast});

    var opt = {
        indent_start  : 0,     // start indentation on every line (only when `beautify`)
        indent_level  : 4,     // indentation level (only when `beautify`)
        indent_start  : 0,
        quote_keys    : false, // quote all keys in object literals?
        space_colon   : true,  // add a space after colon signs?
        ascii_only    : false, // output ASCII-safe? (encodes Unicode characters as ASCII)
        inline_script : false, // escape "</script"?
        width         : 80,    // informative maximum line width (for beautified output)
        max_line_len  : 32000, // maximum line length (for non-beautified output)
        ie_proof      : true,  // output IE-safe code?
        beautify      : false, // beautify output?
        source_map    : null,  // output a source map
        bracketize    : false, // use brackets every time?
        comments      : false, // output comments?
        semicolons    : true,
        beautify      : true
    };

    //console.info('----->\n\n', ast.print_to_string({beautify: true}));
    var stream = UglifyJS.OutputStream(opt);
    console.info(ast.print_to_string.toString())
    ast.print(stream);
    var code = stream.get();
    console.info(code);
  });

  it.skip('test code compress', function() {
    var options = {
      sequences     : true,  // join consecutive statemets with the “comma operator”
      properties    : true,  // optimize property access: a["foo"] → a.foo
      dead_code     : true,  // discard unreachable code
      drop_debugger : true,  // discard “debugger” statements
      unsafe        : true,  // some unsafe optimizations (see below)
      conditionals  : true,  // optimize if-s and conditional expressions
      comparisons   : true,  // optimize comparisons
      evaluate      : true,  // evaluate constant expressions
      booleans      : true,  // optimize boolean expressions
      loops         : true,  // optimize loops
      unused        : true,  // drop unused variables/functions
      hoist_funs    : true,  // hoist function declarations
      hoist_vars    : false, // hoist variable declarations
      if_return     : true,  // optimize if-s followed by return/continue
      join_vars     : true,  // join var declarations
      cascade       : true,  // try to cascade `right` into `left` in sequences
      side_effects  : true,  // drop side-effect-free statements
      warnings      : true,  // warn about potentially dangerous optimizations/code
      global_defs   : {DEBUG: true}     // global definitions
    };

    var ast = null;

    ast = UglifyJS.parse(c1, {filename: "c1", toplevel:ast});
    ast = UglifyJS.parse(c2, {filename: "c2", toplevel:ast});
    ast = UglifyJS.parse(c3, {filename: "c3", toplevel:ast});

    ast.figure_out_scope();
    var compressor = UglifyJS.Compressor(options);
    ast = ast.transform(compressor);
    var code = ast.print_to_string();
    console.info(code);
  });

  it.skip('name mangler test', function() {
    var ast = getAst(astModule, 'src/module.js');
    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names();
    var code = ast.print_to_string();
    console.info();
    console.info(code);

    var ast2 = getAst(astModule, 'src/module.js');
    ast2.figure_out_scope();

    var compressor = UglifyJS.Compressor();
    ast2 = ast2.transform(compressor);
    ast2.figure_out_scope();
    ast2.compute_char_frequency();
    ast2.mangle_names();
    console.info(ast2.print_to_string());
  });

  it.skip('scope analyzer test', function() {
    var code = "function f(x) { if (something) { var x = 10;} var x = 20;}";
    var code = "function foo() {\n\
          function x(){}\n\
          function y(){}\n\
        }\n\
    function bar() {}";
    var ast = UglifyJS.parse(code);

    var toplevel = UglifyJS.parse(code);
    var walker = new UglifyJS.TreeWalker(function(node){
      if (node instanceof UglifyJS.AST_Defun) {
        // string_template is a cute little function that UglifyJS uses for warnings
        console.log(UglifyJS.string_template("Found function {name} at {line},{col}", {
            name: node.name.name,
            line: node.start.line,
            col: node.start.col
        }));
        console.info('--->', walker.parent());
        return true;
      }
    });
    toplevel.walk(walker);
  });
  it.skip('walk test1', function() {
    var code = "function f(){}\n\
    var x = 'a string';\n\
    y = 'foo' + 'bar' + x;\n\
    f('a', 'b', (x + 'z'), y, 'c');\n"; 
    var toplevel = UglifyJS.parse(code);
    var walker = new UglifyJS.TreeWalker(function(node){
      if (node instanceof UglifyJS.AST_String) {
          var p = walker.parent();
          if (p instanceof UglifyJS.AST_Call && node !== p.expression) {
              //console.info('2----->', p.expression)
              console.log("Found string: %s at %d,%d", node.getValue(),
                          node.start.line, node.start.col);
          } else {
              console.log("Found 111string: %s at %d,%d", node.getValue(),
                          node.start.line, node.start.col);
          
          }
      }
    });
    toplevel.walk(walker);
  });
  it.skip('walk test2', function() {
    var code = "function f(){}\n\
    var x = 'a string';\n\
    y = 'foo' + 'bar' + x;\n\
    f('a', 'b', (x + 'z'), y, 'c');\n"; 
    var toplevel = UglifyJS.parse(code);
    var walker = new UglifyJS.TreeWalker(function(node){
      if (node instanceof UglifyJS.AST_String) {
          var p = walker.find_parent(UglifyJS.AST_Call);
          if (p && node !== p.expression) {
              //console.info('2----->', p.expression)
              console.log("Found string: %s at %d,%d", node.getValue(),
                          node.start.line, node.start.col);
          } else {
              console.log("Found 2222string: %s at %d,%d", node.getValue(),
                          node.start.line, node.start.col);
          
          }
      }
    });
    toplevel.walk(walker);
  });

  it.skip('walk test3', function() {
    console.info();
    var code = function toplevel() {
      var a = foo("x", "y", (function(){
        var b = "stuff";
        var c = "bar";
        return x("qwe");
      })(), 1, "z");
    };
    code = code.toString();

    var toplevel = UglifyJS.parse(code);
    var call_expression = null;
    var walker = new UglifyJS.TreeWalker(function(node, descend){
      if (node instanceof UglifyJS.AST_Call) {
          var tmp = call_expression;
          call_expression = node;
          descend();
          call_expression = tmp;
          return true; // prevent descending again
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
    toplevel.walk(walker);
  });

  it.skip('transform test', function() {
    // sample AST
    console.info();

    var ast = UglifyJS.parse("a = 1 + 2");
    
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
    ast.body[0].body.left.name = "CHANGED"; // CHANGED = 1 + 2
    
    console.log(ast.print_to_string({ beautify: true }));
    console.log(ast2.print_to_string({ beautify: true })); 
  });

  it.skip('transform test2', function() {
      // in this hash we will map string to a variable name
    var strings = {};
    
    // here's the transformer:
    var consolidate = new UglifyJS.TreeTransformer(null, function(node){
        if (node instanceof UglifyJS.AST_Toplevel) {
            console.info('1-------');
            // since we get here after the toplevel node was processed,
            // that means at the end, we'll just create the var definition,
            // or better yet, "const", and insert it as the first statement.
            var defs = new UglifyJS.AST_Const({
                definitions: Object.keys(strings).map(function(key){
                    var x = strings[key];
                    return new UglifyJS.AST_VarDef({
                        name  : new UglifyJS.AST_SymbolConst({ name: x.name }),
                        value : x.node, // the original AST_String
                    });
                })
            });
            node.body.unshift(defs);
            return node;
        }
        if (node instanceof UglifyJS.AST_String) {
            console.info('2------>');
            // when we encounter a string, we give it an unique
            // variable name (see the getStringName function below)
            // and return a symbol reference instead.
            return new UglifyJS.AST_SymbolRef({
                start : node.start,
                end   : node.end,
                name  : getStringName(node).name,
            });
        }
    });
    
    var count = 0;
    function getStringName(node) {
        var str = node.getValue(); // node is AST_String
        if (strings.hasOwnProperty(str)) return strings[str];
        var name = "_" + (++count);
        return strings[str] = { name: name, node: node };
    }
    
    // now let's try it.
    var ast = UglifyJS.parse(function foo() {
        console.log("This is a string");
        console.log("Another string");
        console.log("Now repeat");
        var x = "This is a string", y = "Another string";
        var x = x + y + "Now repeat";
        alert("Now repeat".length);
        alert("Another string".length);
        alert("This is a string".length);
    }.toString());
    
    // transform and print
    var ast2 = ast.transform(consolidate);
    console.log(ast2.print_to_string({ beautify: true }));
    
    // also, the change is non-destructive; the original AST remains the same:
    console.log("Original:");
    console.log(ast.print_to_string({ beautify: true }));
  
  });

  it('obj node', function() {
    var code1 = 'var a = "123";';
    var ast1 = UglifyJS.parse(code1);

    //var code2 = '{name:["abc","def"]}';
    var obj2 = {name: ["abc", "def"]};

    var code2 = fsExt.readFileSync(process.cwd(), '/package.json');

    //var code2 = "{name: 1}";
   // var code2 = '(' + JSON.stringify(obj2) + ')';
    code2 = '(' + code2 + ')';
    //console.info('code2', code2)
    var ast2 = UglifyJS.parse(code2);
    var body;
    var call;
    var findJsonNode = new UglifyJS.TreeWalker(function(node, descend) {
      if (node instanceof UglifyJS.AST_Object) {
         console.info('23----->')
         if (findJsonNode.parent().start.value === '(') {
            body = node;
         }
      }
    });
    var ast3 = ast2.walk(findJsonNode);
    console.info(ast2)
     var replaceJson = new UglifyJS.TreeTransformer(null, function(node, descend) {
      if (node instanceof UglifyJS.AST_String) {
        //console.info('------>', node.getValue());
      //console.info('--2222---->', node);
        //return ast2.body[0];
        return body;
      }
    });

    var ast3 = ast1.transform(replaceJson);

    console.info('----->', ast3.print_to_string())
  });
});


function getAst(base, name) {
  var code = fsExt.readFileSync(path.join(base, name));
  return UglifyJS.parse(code, {
    filename : name, // default is null,
    comments: true
  });

}
