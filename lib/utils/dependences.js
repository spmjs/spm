var UglifyJS = require('uglify-js');
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
function parseStatic(ast) {
  if (_.isString(ast)) {
    ast = getAst(ast);
  }

  var deps = [];
  var call_define_expression = null;
  var arr_expression = null;

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

    if (call_define_expression && node instanceof UglifyJS.AST_Array) {
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

  if (_.isString(ast)) {
    ast = getAst(ast);
  }
   
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
    
    var parentNode = walker.parent();
    if (call_expression && node instanceof UglifyJS.AST_String) {
      deps.push(node.getValue());
    }
  });

  ast.walk(walker);
  return deps;
}

// 找到模块中的 rquire 语句，并替换。主要是针对 debug 模块的替换.
function replaceRequire(code, project, debug) {

 var ast = getAst(code);
  Ast.walk(ast, 'call', function(stat) {
    if (stat.toString().indexOf('call,name,require,') !== 0) {
      return stat;
    }

    // stat:
    //   [ 'call', [ 'name', 'require' ], [ [ 'string', 'a' ] ] ]
    var argsAst = stat[2];

    argsAst.forEach(function(item) {
      if (item[0] === 'string') {
        var depModName = item[1];
        if (moduleHelp.isRelative(depModName)) {
          depModName = moduleHelp.getBaseModule(depModName) + debug;
        } else {
          depModName = project.getGlobalModuleId(depModName) + debug;
        }
        item[1] = depModName;
      }
    });
    return stat;
  });

  return Ast.gen_code(ast, {beautify: true});
}


function getAst(inputFile, charset) {
  if (typeof inputFile !== 'string') {
    return inputFile;
  }

  if (!fsExt.existsSync(inputFile)) {
    return UglifyJS.parse(inputFile);
  }

  return astParser.parse(fsExt.readFileSync(inputFile));
}


Dependences.parse = parse;
Dependences.replaceRequire = replaceRequire;
Dependences._parseStatic = parseStatic;
Dependences._parseDynamic = parseDynamic;
