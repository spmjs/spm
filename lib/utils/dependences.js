/**
 * @fileoverview Extracts module dependencies.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var astParser = require('uglify-js').parser;

var Ast = require('./ast.js');


var Dependences = exports;


function parse(inputFile, charset) {
  var ast = getAst(inputFile, charset);

  var deps = parseStatic(ast);
  if (deps === undefined) {
    deps = parseDynamic(ast);
  }
  return deps;
}


function parseStatic(inputFile, charset) {
  var ast = getAst(inputFile, charset);
  var deps, times = 0;

  Ast.walk(ast, 'stat', function(stat) {
    if (stat.toString().indexOf('stat,call,name,define,') !== 0) {
      return stat;
    }

    // only process the first one.
    if (++times > 1) {
      return;
    }

    // stat[1]:
    //     [ 'call',
    //       [ 'name', 'define' ],
    //       [ [Object], [Object], [Object ] ] ]
    var argsAst = stat[1][2];
    var depsAst;

    // argsAst:
    //   [ [ 'string', 'a' ],
    //     [ 'array', [ [Object], [Object] ] ],
    //     [ 'function', null, [], [] ] ]
    argsAst.some(function(item, i) {
      // NOTICE: the deps MUST be literal, it can NOT be a reference.
      if (item[0] === 'array' && i !== argsAst.length - 1) {
        depsAst = item[1];
        return true;
      }
    });

    if (!depsAst) {
      return stat;
    }

    // depsAst:
    //   [ [ 'string', 'b' ], [ 'string', 'c' ] ]
    deps = [];
    depsAst.forEach(function(item) {
      if (item[0] === 'string') {
        deps.push(item[1]);
      }
    });

    return stat;
  });

  return deps;
}


function parseDynamic(inputFile, charset) {
  var ast = getAst(inputFile, charset);
  var deps = [];

  Ast.walk(ast, 'call', function(stat) {
    if (stat.toString().indexOf('call,name,require,') !== 0) {
      return stat;
    }

    // stat:
    //   [ 'call', [ 'name', 'require' ], [ [ 'string', 'a' ] ] ]
    var argsAst = stat[2];

    argsAst.forEach(function(item) {
      if (item[0] === 'string') {
        deps.push(item[1]);
      }
    });
    
    return stat;
  });

  return deps;
}


function getAst(inputFile, charset) {
  if (typeof inputFile !== 'string') {
    return inputFile;
  }
  return astParser.parse(fs.readFileSync(inputFile, charset || 'utf8'));
}


Dependences.parse = parse;
Dependences._parseStatic = parseStatic;
Dependences._parseDynamic = parseDynamic;
