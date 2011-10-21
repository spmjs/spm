/**
 * @fileoverview Parses module name and dependencies.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

var Dependences = require('./Dependences');
var Ast = require('./Ast');
var WinOS = require('./WinOS');


var Compressor = exports;


Compressor.compress = function(inputFile, outputFile, config) {

  // config: { charset, from, libsPath }
  config || (config = {});
  var charset = config['charset'] || 'utf8';

  // gen code
  var meta = getMeta(inputFile, config);

  var code = fs.readFileSync(inputFile, charset);
  var ast = jsp.parse(code);
  var out = generateCode(ast, meta);

  // output
  if (outputFile) {
    fs.writeFileSync(outputFile, out, charset);
    console.log('  ... process ' + path.relative(process.cwd(), inputFile));
  }

  return out;
};


function getMeta(inputFile, config) {
  config || (config = {});
  var meta = {};

  meta.deps = Dependences.parse(inputFile, config.charset);
  meta.id = getId(inputFile, config);

  return meta;
}


function getId(inputFile, config) {
  var id;
  var LIBS_PATH = config.libs_path;
  var from = config.from || inputFile;

  // top-level modules
  if (LIBS_PATH && inputFile.indexOf(LIBS_PATH) === 0) {
    id = path.basename(inputFile, '.js');
    id = id.replace('-debug', '');
  }
  else {
    id = getRelativeId(from, inputFile);
    id = id.replace(/\.js$/, '')
  }

  return id;
}


/* for node >=0.5.5 */
function getRelativeId(from, to) {
  // if from is    '/path/to/abc/main.js'
  // when to is    '/path/to/abc/sub/a.js'
  // then return   './sub/a.js'
  // when to is    '/path/to/xyz/c.js'
  // then return   '../../xyz/c.js'
  var result = path.relative(path.dirname(from), to);

  if (result.charAt(0) !== '.') {
    result = './' + result;
  }

  return WinOS.normalizePath(result);
}


function generateCode(ast, meta) {
  var times = 0;

  ast = Ast.walk(ast, 'stat', function(stat) {
    if (stat.toString().indexOf('stat,call,name,define,') !== 0) {
      return stat;
    }

    if (++times > 1) {
      throw 'Found multiple "define" in one module file. It is NOT allowed.';
    }

    var id, deps;

    if (meta.id) {
      id = ['string', meta.id];
    }

    if (meta.deps) {
      deps = ['array', meta.deps.map(function(item) {
        return ['string', item];
      })];
    }

    // stat[1]:
    //     [ 'call',
    //       [ 'name', 'define' ],
    //       [ [ 'function', null, [Object], [Object] ] ] ]
    var args = stat[1][2];
    //console.log(args);

    // define(factory)
    if (args.length === 1 && deps) {
      args.unshift(deps);
    }

    if (args.length === 2) {
      var type = args[0][0];

      // define(id, factory)
      if (type === 'string' && deps) {
        var factory = args.pop();
        args.push(deps, factory);
      }
      // define(deps, factory)
      else if (type === 'array' && id) {
        args.unshift(id);
      }
    }

    return stat;
  });

  ast = pro.ast_mangle(ast);
  ast = pro.ast_squeeze(ast);
  return pro.gen_code(ast) + ';';
}


Compressor.getMeta_ = getMeta;
