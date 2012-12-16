var UglifyJS = require('uglify-js');
var path = require('path');
var _ = require('underscore');

var fsExt = require('./fs_ext.js');
var moduleHelp = require('./module_help.js');

var Dependences = exports;

function parse(inputFile) {
  var ast = getAst(inputFile);
  var deps = parseStatic(ast);

  if (deps === undefined) {
    deps = parseDynamic(ast);
  }
  return deps;
}

// 解析模块静态依赖，比如 define('id', ['dep1', 'dep2'], function(]
// 将会返回 ['dep1', 'dep2']
function parseStatic(ast, id) {
  ast = getAst(ast);

  var deps = [];
  var call_define_expression = null;
  var arr_expression = null;
  var defineId = null;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      var temp = call_define_expression;
      call_define_expression = node;
      descend();
      call_define_expression = temp;
      return true;
    }

    if (node instanceof UglifyJS.AST_Lambda) {
      var tmp = call_define_expression;
      call_define_expression = null;
      descend();
      call_define_expression = tmp;
      return true;
    }

    // 如果用户指定 id(因为模块可能是合并模块), 需要找到对应的 id的依赖.
    // 由于 id 在前面，所以可以优先匹配到.
    if (id && call_define_expression &&
              node instanceof UglifyJS.AST_String &&
              walker.parent() instanceof UglifyJS.AST_Call) {

       defineId = node.getValue();
       if (id !== defineId) {
         return false;
       }
    }

    if (call_define_expression && node instanceof UglifyJS.AST_Array) {
      if(id && id !== defineId) {
        return false;
      }
      var temp = arr_expression;
      arr_expression = node;
      descend();
      arr_expression = temp;
      return true;
    }

    if (arr_expression && node instanceof UglifyJS.AST_String) {
      deps.push(node.getValue());
    }
  });

  ast.walk(walker);
  return deps.length ? deps : undefined;
}

// 解析动态依赖，主要通过找到代码中的 require('jquery'); 语句。
// ['jquery']
function parseDynamic(ast) {
  ast = getAst(ast);
   
  var deps = [];
  var call_expression = null;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call &&
        node.start.value === 'require' &&
        node.expression.name === 'require') {

      var temp = call_expression;
      call_expression = node;
      descend();
      call_expression = temp;
      return true;
    }
    
    if (call_expression && node instanceof UglifyJS.AST_String) {
      deps.push(node.getValue());
    }
  });

  ast.walk(walker);
  return deps;
}

// 一个模块可能有多个模块合并而成，需要 parse 这个文件是那几个模块组成。
function parseDefine(ast) {
  ast = getAst(ast);
  var ids = [];
  var call_define_expression = null;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      var temp = call_define_expression;
      call_define_expression = node;
      descend();
      call_define_expression = temp;
      return true;
    }

    if (node instanceof UglifyJS.AST_Lambda) {
      var tmp = call_define_expression;
      call_define_expression = null;
      descend();
      call_define_expression = tmp;
      return true;
    }

    if (call_define_expression &&
       node instanceof UglifyJS.AST_String &&
       walker.parent() instanceof UglifyJS.AST_Call) {
      ids.push(node.getValue());
      return false;
    }
  });

  ast.walk(walker);
  return ids;
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

Dependences.parse = parse;
Dependences.parseStatic = parseStatic;
Dependences.parseDynamic = parseDynamic;
Dependences.parseDefine = parseDefine;
Dependences.getAst = getAst;
