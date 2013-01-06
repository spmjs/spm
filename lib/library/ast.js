/*
 * dependency sdk
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');
var _ = require('underscore');
var UglifyJS = require('uglify-js');


function getAst(ast) {
  if (_.isString(ast)) {
    return UglifyJS.parse(ast);
  }
  return ast;
}
exports.getAst = getAst;


function parseDefine(ast) {
  ast = getAst(ast);
  var id, factory, depends = [];

  var defineCount = 0;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    // don't collect depends in the define in define
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      defineCount += 1;

      if (!node.args || !node.args.length) return true;

      if (node.args.length === 1) {
        factory = _.first(node.args);
        return true;
      }

      if (node.args.length === 2) {
        factory = _.last(node.args);
        var child = _.first(node.args);
        if (child instanceof UglifyJS.AST_Array) {
          // define([], function(){});
          depends = _.map(child.elements, function(el) {
            if (el instanceof UglifyJS.AST_String) {
              return el.getValue();
            }
          });
        } else if (child instanceof UglifyJS.AST_String) {
          // define('id', function() {});
          id = child.getValue();
        }
        return true;
      }
      factory = node.args[2];

      var firstChild = node.args[0], secondChild = node.args[1];
      if (firstChild instanceof UglifyJS.AST_String) {
        if (!id) {
          id = firstChild.getValue();
        } else {
          // TODO warnning
        }
      }
      var deps;
      if (secondChild instanceof UglifyJS.AST_Array) {
        deps = _.map(secondChild.elements, function(el) {
          if (el instanceof UglifyJS.AST_String) {
            return el.getValue();
          }
        });
        depends = depends.concat(deps);
      }
      return true;
    }
  });

  ast.walk(walker);

  if (defineCount > 1) {
    id = undefined;
    factory = undefined;
  }

  return {id: id, dependencies: depends, factory: factory};
}
exports.parseDefine = parseDefine;


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


function replaceRequire(ast, fn, output) {
  output = output || 'string'
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
  })
}
exports.replaceRequire = replaceRequire;


function replaceDefine(ast, id, deps) {
  var ret = parseDefine(ast);
  var factory = parseDefine(ast).factory;

  if (!factory) {
    if (_.isString(ast)) {
      return ast;
    } else {
      return ast.print_to_string({
        'beautify': true,
        'comments': true
      });
    }
  }
  var code = factory.print_to_string({
    'beautify': true,
    'comments': true
  });
  deps = JSON.stringify(deps);
  return util.format('define("%s", %s, %s)', id, deps, code);
}
exports.replaceDefine = replaceDefine;

function replaceAll(ast, fn) {
  ast = replaceRequire(ast, fn, 'ast')
  var ret = parseDefine(ast);

  if (!ret.factory) {
    return ast.print_to_string({
      'beautify': true,
      'comments': true
    });
  }
  var code = ret.factory.print_to_string({
    'beautify': true,
    'comments': true
  });
  var deps = (ret.dependencies || []).map(fn);
  deps = JSON.stringify(deps);

  var id = fn(ret.id);
  return util.format('define("%s", %s, %s)', id, deps, code);
}
exports.replaceAll = replaceAll;
