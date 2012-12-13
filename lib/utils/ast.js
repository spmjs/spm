 // fileoverview Utilities for AST.
var UglifyJS = require('uglify-js');

var Ast = module.exports;

Ast.replaceRequire = function(code, replaceFn) {

  var ast = UglifyJS.parse(code, {
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
      var value = replaceFn(node.getValue());

      return new UglifyJS.AST_String({
        start: node.start,
        end: node.end,
        value: value
      });
    }
  });

  var ast2 = ast.transform(replace);
  return ast2.print_to_string({
    beautify: true,
    comments: true
  });
};

Ast.gen_code = function() {

}

