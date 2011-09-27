/**
 * @fileoverview Parse seajs.config alias.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var astParser = require('uglify-js').parser;


var Alias = exports;


/**
 * Parses alias object from config file.
 */
Alias.parse = function(configFile, charset) {

  var code = fs.readFileSync(configFile, charset || 'utf-8');
  var ast = astParser.parse(code);
  var configStat;
  var alias = {};


  // find seajs.config stat.
  ast[1].some(function(stat) {
    if (stat.toString().indexOf('stat,call,dot,name,seajs,config,') === 0) {
      configStat = stat;
      return true;
    }
  });
  if (!configStat) return alias;


  // find alias config.
  var configItems = configStat[1][2][0][1];
  var aliasConfig;

  configItems.some(function(item) {
    if (item[0] === 'alias') {
      aliasConfig = item[1][1];
      return true;
    }
  });
  if (!aliasConfig) return alias;


  // convert aliasConfig ast to object.
  // aliasConfig:
  //  [ [ 'increment', [ 'string', 'increment.js?t=20110530' ] ],
  //    [ 'lib', [ 'string', './sub/lib' ] ],
  //    [ 'underscore', [ 'string', 'underscore/1.1.6/underscore' ] ] ]
  aliasConfig.forEach(function(item) {
    alias[item[0]] = item[1][1];
  });

  return alias;
};


Alias.parseAliasInDependences = function(alias, deps) {
  deps.forEach(function(item, i) {
    deps[i] = parseAlias(item, alias);
  });
};


// Sync with: seajs/src/util-helper.js:parseAlias
function parseAlias(id, alias) {
  var parts = id.split('/');
  var last = parts.length - 1;
  var parsed = false;

  parse(parts, 0);
  if (!parsed && last) {
    parse(parts, last);
  }

  function parse(parts, i) {
    var part = parts[i];
    if (alias && alias.hasOwnProperty(part)) {
      parts[i] = alias[part];
      parsed = true;
    }
  }

  return parts.join('/');
}
