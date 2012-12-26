var UglifyJS = require('uglify-js');
var _ = require('underscore');

var fsExt = require('./fs_ext.js');

var Ast = module.exports;

// 替换 require 的内容。
Ast.replaceRequireValue = function(code, replaceFn) {

  var ast = getAst(code);

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

    if (node instanceof UglifyJS.AST_String &&
            call_expression && 
            replace.parent().start.value === 'require') {

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

// 替换整个 require
Ast.replaceRequire = function(code, isNeedValue, replaceFn) {
  var ast = getAst(code);

  return replaceRequireNode(code, isNeedValue, function(node, value) {
    return new UglifyJS.AST_String({
      start: node.start,
      end: node.end,
      value: replaceFn(value)
    });
 
  });
};

var replaceRequireNode = Ast.replaceRequireNode = function(code, isNeedValue, fn) {
  var ast = getAst(code);

  var find = false;
  var replace = new UglifyJS.TreeTransformer(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call &&
        node.start.value === 'require' &&
        node.expression.name === 'require') {

      var value = node.args[0] && node.args[0].value;
      if (isNeedValue(value)) {
        find = true;
        return fn(node, value);
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
}

function getAst(inputFile) {
  if (!_.isString(inputFile)) return inputFile;

  if (fsExt.existsSync(inputFile)) {
    inputFile = fsExt.readFileSync(inputFile);
  }

  return UglifyJS.parse(inputFile, {
    comments: true
  });
}
