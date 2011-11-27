/**
 * @fileoverview Parse seajs.config.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var astParser = require('uglify-js').parser;

var Ast = require('./ast.js');


var LoaderConfig = exports;


LoaderConfig.parseAlias = function(configFile, charset) {
  var code = fs.readFileSync(configFile, charset || 'utf8');
  var ast = astParser.parse(code);
  var alias = {};

  // find seajs.config stat.
  Ast.walk(ast, 'stat', function(stat) {
    if (stat.toString().indexOf('stat,call,dot,name,seajs,config,') !== 0) {
      return stat;
    }

    // find alias config.
    // [ 'stat',
    //   [ 'call', [ 'dot', ['name', 'seajs'], 'config' ], [ ['object', [Object]] ] ] ]
    var configArgs = stat[1][2][0];
    if (!configArgs || configArgs[0] !== 'object') {
      return stat;
    }

    var configAst = configArgs[1];
    var aliasAst;

    configAst.some(function(item) {
      if (item[0] === 'alias') {
        aliasAst = item[1][1];
        return true;
      }
    });

    if (!aliasAst) return stat;

    // convert aliasConfig ast to object.
    // aliasConfig:
    //  [ [ 'increment', [ 'string', 'increment.js?t=20110530' ] ],
    //    [ 'lib', [ 'string', './sub/lib' ] ],
    //    [ 'underscore', [ 'string', 'underscore/1.1.6/underscore' ] ] ]
    aliasAst.forEach(function(item) {
      alias[item[0]] = item[1][1];
    });

    return stat;
  });

  return alias;
};
