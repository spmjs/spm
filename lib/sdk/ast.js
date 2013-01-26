/*
 * spm.sdk.ast
 * https://spmjs.org
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');
var _ = require('underscore');
var UglifyJS = require('uglify-js');


// UglifyJS ast.
function getAst(ast) {
  if (_.isString(ast)) {
    return UglifyJS.parse(ast);
  }
  return ast;
}
exports.getAst = getAst;


// A standard cmd module:
//
//   define('id', ['deps'], fn)
//
// Return everything in define:
//
//   {id: 'id', dependencies: ['deps'], factory: ast of fn}
function parseDefines(ast) {
  ast = getAst(ast);
  var defines = [];

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    // don't collect dependencies in the define in define
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      var id, factory, dependencies = [];
      if (!node.args || !node.args.length) return true;

      if (node.args.length === 1) {
        factory = _.first(node.args);
        defines.push({id: id, dependencies: dependencies, factory: factory});
        return true;
      }

      if (node.args.length === 2) {
        factory = _.last(node.args);
        var child = _.first(node.args);
        if (child instanceof UglifyJS.AST_Array) {
          // define([], function(){});
          dependencies = _.map(child.elements, function(el) {
            if (el instanceof UglifyJS.AST_String) {
              return el.getValue();
            }
          });
        } else if (child instanceof UglifyJS.AST_String) {
          // define('id', function() {});
          id = child.getValue();
        }
        defines.push({id: id, dependencies: dependencies, factory: factory});
        return true;
      }
      factory = node.args[2];

      var firstChild = node.args[0], secondChild = node.args[1];
      if (firstChild instanceof UglifyJS.AST_String) {
        id = firstChild.getValue();
      }
      if (secondChild instanceof UglifyJS.AST_Array) {
        dependencies = _.map(secondChild.elements, function(el) {
          if (el instanceof UglifyJS.AST_String) {
            return el.getValue();
          }
        });
      }
      defines.push({id: id, dependencies: dependencies, factory: factory});
      return true;
    }
  });

  ast.walk(walker);

  return defines;
}
exports.parseDefines = parseDefines;


// A standard cmd module:
//
//   define(function(require) {
//       var $ = require('jquery')
//       var _ = require('underscore')
//   })
//
// Return everything in `require`: ['jquery', 'underscore'].
function getRequires(ast) {
  ast = getAst(ast);

  var deps = [];

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
      if (node.args && node.args.length === 1) {
        var child = node.args[0];
        if (child instanceof UglifyJS.AST_String) {
          deps.push(child.getValue());
        }
        // TODO warning
      }
      return true;
    }
  });

  ast.walk(walker);
  return deps;
}
exports.getRequires = getRequires;


// Replace every string in `require`.
//
//    define(function(require) {
//        var $ = require('jquery')
//    })
//
// Replace requires in this code:
//
//    replaceRequire(code, function(value) {
//        if (value === 'jquery') return 'zepto';
//        return value;
//    })
function replaceRequire(ast, fn, output) {
  output = output || 'string';
  ast = getAst(ast);

  var trans = new UglifyJS.TreeTransformer(function(node, descend) {
    if (node instanceof UglifyJS.AST_String) {
      var parent = trans.parent();
      if (parent instanceof UglifyJS.AST_Call && parent.start.value === 'require') {
        return new UglifyJS.AST_String({
          start: node.start,
          end: node.end,
          value: fn(node.getValue())
        });
      }
    }
  });
  ast = ast.transform(trans);

  if (output === 'ast') return ast;

  return ast.print_to_string({
    'beautify': true,
    'comments': true
  });
}
exports.replaceRequire = replaceRequire;


// Replace id and dependencies in `define`.
//
//    define('id1', [], fn)
//
// Replace define in this code:
//
//   replaceDefine(code, 'id2', ['a'])
function replaceDefine(ast, id, deps) {
  var rets = parseDefines(ast);

  if (rets.length !== 1) {
    if (_.isString(ast)) return ast;
    return ast.print_to_string({
      'beautify': true,
      'comments': true
    });
  }

  var factory = rets[0].factory;
  var code = factory.print_to_string({
    'beautify': true,
    'comments': true
  });
  deps = JSON.stringify(deps);
  return util.format('define("%s", %s, %s)', id, deps, code);
}
exports.replaceDefine = replaceDefine;


// Replace everything in `define` and `require`.
//
//    define('id', ['a'], function(require) {
//        var $ = require('jquery')
//    })
//
// Replace the code with:
//
//    replaceAll(code, function(value) {
//        return value + '-debug';
//    })
//
// The result will be:
//
//    define('id-debug', ['a-debug'], function(require) {
//        var $ = require('jquery-debug')
//    })
function replaceAll(ast, fn) {
  ast = replaceRequire(ast, fn, 'ast');
  var rets = parseDefines(ast);
  var data = '';

  _.each(rets, function(ret) {
    var code = ret.factory.print_to_string({
      'beautify': true,
      'comments': true
    });
    var deps = (ret.dependencies || []).map(fn);
    deps = JSON.stringify(deps);

    var id = fn(ret.id);
    data += util.format('define("%s", %s, %s)', id, deps, code) + '\n';
  });

  return data;
}
exports.replaceAll = replaceAll;
