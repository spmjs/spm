
/**
 * @fileoverview Parse seajs.config alias.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var uglifyjs = require('../../support/uglify-js/uglify-js');


/**
 * Parses alias object from config file.
 * @param {Array} deps The deps to parse.
 * @param {string} configFile The config file.
 * @return {Array} The parsed deps.
 */
exports.parse = function(deps, configFile) {

  var code = fs.readFileSync(configFile, 'utf-8');
  var ast = uglifyjs.parser.parse(code);
  var configStat;


  // find seajs.config stat.
  ast[1].some(function(stat) {
    if (stat.toString().indexOf('stat,call,dot,name,seajs,config,') === 0) {
      configStat = stat;
      return true;
    }
  });
  if(!configStat) return deps;


  // find alias config.
  var configItems = configStat[1][2][0][1];
  var aliasConfig;

  configItems.some(function(item) {
    if (item[0] === 'alias') {
      aliasConfig = item[1][1];
      return true;
    }
  });
  if(!aliasConfig) return deps;

  
  // convert aliasConfig ast to object.
  // aliasConfig:
  //  [ [ 'increment', [ 'string', 'increment.js?t=20110530' ] ],
  //    [ 'lib', [ 'string', './sub/lib' ] ],
  //    [ 'underscore', [ 'string', 'underscore/1.1.6/underscore' ] ] ]
  var alias = {};
  aliasConfig.forEach(function(item) {
    alias[item[0]] = item[1][1];
  });

  // replace alias.
  replace(deps, alias);

  return deps;
};


function replace(arr, alias) {
  arr.forEach(function(item, i) {
    arr[i] = parseAlias(item, alias);
  });
}


// Sync with: seajs/src/util-helper.js:parseAlias
function parseAlias(id, alias) {

  var parts = id.split('/');
  var last = parts.length - 1;

  parse(parts, 0);
  if (last) parse(parts, last);

  function parse(parts, i) {
    var part = parts[i];
    var m;

    if (alias && alias.hasOwnProperty(part)) {
      parts[i] = alias[part];
    }
    // jquery:1.6.1 => jquery/1.6.1/jquery
    // jquery:1.6.1-debug => jquery/1.6.1/jquery-debug
    else if ((m = part.match(/(.+):([\d\.]+)(-debug)?/))) {
      parts[i] = m[1] + '/' + m[2] + '/' + m[1] + (m[3] ? m[3] : '');
    }
  }

  return parts.join('/');
}
