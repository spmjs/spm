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


function replaceRequire(key, value) {
}
