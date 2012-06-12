 // fileoverview Utilities for AST.

var uglifyjs = require('uglify-js');
var pro = uglifyjs.uglify;

var Ast = exports;

Ast.walk = function(ast, type, walker) {
    var w = pro.ast_walker();

    var walkers = {};
    walkers[type] = function() {
        walker(this);
    };

    ast = w.with_walkers(walkers, function() {
        return w.walk(ast);
    });

    return ast;
};
