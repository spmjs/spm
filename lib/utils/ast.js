 // fileoverview Utilities for AST.
var UglifyJS = require('uglify-js');

var Ast = module.exports;

Ast.replaceRequireValue = function(code, replaceFn) {
  var ast = UglifyJS.parse(code, {
      comments: true
  });

  var call_expression = null;

  var replace = new UglifyJS.TreeTransformer(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
      node = node.clone();
      var temp = call_expression;
      call_expression = node;
//console.info('---->', node)
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

Ast.replaceRequire = function(code, isNeedValue, replaceFn) {
  var ast = UglifyJS.parse(code, {
      comments: true
  });

console.info('------332-')

  var find = false;
  var replace = new UglifyJS.TreeTransformer(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call &&
        node.start.value === 'require' &&
        node.expression.name === 'require') {
console.info('------3333-')
      var value = node.args[0] && node.args[0].value;
      if (isNeedValue(value)) {
        find = true;
        console.info('------')
        return new UglifyJS.AST_String({
          start: node.start,
          end: node.end,
          value: replaceFn(value)
        });
      }
      return node;
    }

  });

  var ast2 = ast.transform(replace);
  if (find) {
    return ast2.print_to_string({
      beautify: true,
      comments: true
    });
  } else {
    return code;
  }
};

Ast._findRequireNode = function(ast) {

};

