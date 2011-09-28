/**
 * @fileoverview Parses module name and dependencies.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');

var Dependences = require('./Dependences');


var Compressor = exports;


Compressor.compress = function(inputFile, outputFile, config) {

  config = config || {};
  var charset = config['charset'] || 'utf-8';

  // get compressed code
  var meta = getMeta(
      inputFile,
      config['baseFile'] || path.join(process.cwd(), 'INDEX'),
      config);

  var code = fs.readFileSync(inputFile, charset);
  var ast = uglifyjs.parser.parse(code);
  var out = generateCode(ast, meta, config['compress']);

  // output
  if (outputFile) {
    if (outputFile == 'auto') {
      outputFile = getDefaultOutputPath(inputFile, config);
    }
    fs.writeFileSync(outputFile, out, charset);
    console.log(' ... process ' + path.relative(process.cwd(), inputFile));
    return outputFile;
  }
  else {
    console.log(out);
    return out;
  }
};


function getMeta(inputFile, baseFile, config) {
  var meta = {};
  meta.deps = Dependences.parse(inputFile, config.charset);

  if (!config.depsOnly) {
    meta.id = getId(inputFile, baseFile, config);
  }
  return meta;
}


function getId(inputFile, baseFile, config) {
  var id;

  // top-level modules
  if (inputFile.indexOf(config['MODULES_DIR']) === 0) {
    id = path.basename(inputFile, '.js');
    id = id.replace('-debug', '');
  }
  else {
    id = getRelativeId(inputFile, baseFile);
    id = id.replace(/\.js$/, '')
  }

  return id;
}


function getRelativeId(inputFile, baseFile) {
  // if baseFile is    '/path/to/abc/main.js'
  // when inputFile is '/path/to/abc/sub/a.js'
  // then name is      './sub/a.js'
  // when inputFile is '/path/to/xyz/c.js'
  // then name is      '../../xyz/c.js'
  var base = path.dirname(baseFile).split('/');

  var parts = path.dirname(inputFile).split('/');
  parts.push(path.basename(inputFile));

  var id = [];

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] != base[i]) {
      if (base[i]) {
        for (var j = i; j < parts.length; j++) {
          id.push('..');
        }
      }

      if (id.length === 0) {
        id.push('.');
      }

      id = id.concat(parts.slice(i));
      break;
    }
  }

  return id.join('/');
}


function generateCode(ast, meta, compress) {
  // ast: [ 'toplevel', [ [ 'stat', [Object] ], [ 'stat', [Object], ... ] ] ]
  var stats = ast[1];

  for (var i = 0; i < stats.length; i++) {
    // [ 'stat', [ 'call', [ 'name', 'define' ], [ [Object] ] ] ]
    var stat = stats[i];

    if (stat.toString()
        .indexOf('stat,call,name,define,') == 0) {

      // stat[1]:
      //     [ 'call',
      //       [ 'name', 'define' ],
      //       [ [ 'function', null, [Object], [Object] ] ] ]
      var args = stat[1][2];
      //console.log(args);

      if (args.length === 1) {
        args.unshift(['array', meta.deps.map(function(item) {
          return ['string', item];
        })]);
      }

      if (args.length === 2 && meta.name) {
        args.unshift(['string', meta.name]);
      }

      // only process first 'define'
      break;
    }
  }

  var pro = uglifyjs.uglify;

  if (compress) {
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
  }

  return pro.gen_code(ast, {
    beautify: !compress,
    indent_level: 2
  }) + ';';
}


function getDefaultOutputPath(inputFile, config) {
  var outputDir = path.join(path.dirname(inputFile), config['BUILD_DIR']);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}
