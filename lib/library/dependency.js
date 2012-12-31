/*
 * dependency sdk
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');
var _ = require('underscore');
var UglifyJS = require('uglify-js');


function parseDefine(ast) {
  if (_.isString(ast)) {
    ast = UglifyJS.parse(ast);
  }
  var depends = [];

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    // don't collect depends in the define in define
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      if (!node.args || !node.args.length) return true;

      var deps, hasFactory;
      _.each(node.args, function(child) {
        // TODO, throw error when there are two arrays
        if (child instanceof UglifyJS.AST_Array && child.elements && !deps) {
          deps = _.map(child.elements, function(el) {
            if (el instanceof UglifyJS.AST_String) {
              return el.getValue();
            }
            // TODO, else throw error
          });
        }
        if (child instanceof UglifyJS.AST_Function) {
          hasFactory = true;
        }
      });
      // if no factory, it maybe
      // define([1, 2, 3])
      if (hasFactory && deps) {
        depends = depends.concat(deps);
      }
      return true;
    }
  });

  ast.walk(walker);
  return depends.length ? depends: undefined;
}
exports.parseDefine = parseDefine;


function parseRequire(ast) {
  if (_.isString(ast)) {
    ast = UglifyJS.parse(ast);
  }

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
exports.parseRequire = parseRequire;


function replaceRequire(ast, fn) {
  if (_.isString(ast)) {
    ast = UglifyJS.parse(ast);
  }

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
  return ast.transform(trans).print_to_string({
    'beautify': true,
    'comments': true
  });
}
exports.replaceRequire = replaceRequire;


function replaceDefine(ast, id, deps) {
  if (_.isString(ast)) {
    ast = UglifyJS.parse(ast);
  }
  var factory, valid = true;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    // don't collect depends in the define in define
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      if (!node.args || !node.args.length) {
        valid = false;
        return true;
      }
      // should only has 1 factory
      if (factory) {
        valid = false;
        return true;
      }
      if (node.args.length === 1) {
        factory = node.args[0];
      }
      return true;
    }
  });

  ast.walk(walker);

  if (!valid) {
    return ast.print_to_string({
      'beautify': true,
      'comments': true
    });
  }
  var code = factory.print_to_string({
    'beautify': true,
    'comments': true
  });
  deps = JSON.stringify(deps);
  return util.format('define("%s", %s, %s)', id, deps, code);
}
exports.replaceDefine = replaceDefine;
