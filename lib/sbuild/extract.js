
/**
 * @fileoverview Extracts module name and dependencies.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('../../support/uglify-js/uglify-js');

var util = require('../util');
var config = require('../config');
var alias = require('./alias');


// Call directly: node extract.js --input a.js --output b.js --compress
if (util.isCalledDirectly(__filename)) {
  var inputFile, outputFile, compress;

  for (var i = 2; i < process.argv.length; i++) {
    var name = process.argv[i];
    if (name === '--input') {
      inputFile = process.argv[++i];
    }
    else if (name === '--output') {
      outputFile = process.argv[++i];
    }
  }

  compress = process.argv.indexOf('--compress') !== -1;

  if (!inputFile) {
    console.log(
        'Usage: node extract --input a.js [--output out.js] [--compress]');
    process.exit();
  }

  run(inputFile, outputFile, compress);
  process.exit();
}


function run(inputFile, outputFile, config) {
  inputFile = util.normalize(inputFile);
  config = config || {};

  var code = fs.readFileSync(inputFile, 'utf-8');
  var ast = uglifyjs.parser.parse(code);

  var info = extractInfo(inputFile, ast,
      config['baseFile'] || path.join(process.cwd(), 'INDEX'),
      config['depsOnly'] !== false,
      config['configFile']);

  var out = generateCode(ast, info, config['compress']);

  if (outputFile) {
    if (outputFile == 'auto') {
      outputFile = util.getDefaultOutputFilepath(inputFile);
    }
    fs.writeFileSync(outputFile, out, 'utf-8');
    console.log(' ... process ' + util.getRelativePath(inputFile));
    return outputFile;
  }
  else {
    //console.log(out);
    return out;
  }
}


function extractInfo(inputFile, ast, baseFile, depsOnly, configFile) {
  var info = {};

  var deps = getDependencies(ast);
  console.log('****', configFile)
  if (configFile) {
    deps = alias.parse(deps, configFile);
  }
  info.deps = deps;

  if (!depsOnly) {
    var name;

    // top-level modules
    if (inputFile.indexOf(config.modulesDir) === 0) {
      name = inputFile.substring(config.modulesDir.length + 1);
    }
    else {
      name = getRelativeName(inputFile, baseFile);
    }

    info.name = name.replace(/\.js$/, '');
  }

  return info;
}


function getRelativeName(inputFile, baseFile) {
  // if baseFile is    '/path/to/abc/main.js'
  // when inputFile is '/path/to/abc/sub/a.js'
  // then name is      './sub/a.js'
  // when inputFile is '/path/to/xyz/c.js'
  // then name is      '../../xyz/c.js'
  var base = path.dirname(baseFile).split('/');

  var parts = path.dirname(inputFile).split('/');
  parts.push(path.basename(inputFile));

  var name = [];

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] != base[i]) {
      if (base[i]) {
        for (var j = i; j < parts.length; i++) {
          name.push('..');
        }
      }

      if (name.length === 0) {
        name.push('.');
      }

      name = name.concat(parts.slice(i));
      break;
    }
  }

  return name.join('/');
}


function getDependencies(ast) {
  return getStaticDependencies(ast) || getDynamicDependencies(ast);
}


function getDynamicDependencies(ast) {
  var deps = [];

  // get dependencies
  // require('a') ==> call,name,require,string,a
  var pattern = /,call,name,require,string,([^,?]+)(?:\?|,|$)/g;
  var text = ast.toString();
  var match;
  while ((match = pattern.exec(text))) {
    if (deps.indexOf(match[1]) == -1) {
      deps.push(match[1]);
    }
  }

  return deps;
}


function getStaticDependencies(ast) {
  var deps = null;

  // ast: [ 'toplevel', [ [ 'stat', [Object] ], [ 'stat', [Object], ... ] ] ]
  var stats = ast[1];

  for (var i = 0; i < stats.length; i++) {
    // [ 'stat', [ 'call', [ 'name', 'define' ], [ [Object] ] ] ]
    var stat = stats[i];

    if (stat.toString()
        .indexOf('stat,call,name,define,') == 0) {

      // stat:
      // [ 'stat',
      //   [ 'call',
      //     [ 'name', 'define' ],
      //     [ [Object], [Object], [Object] ] ] ]
      var args = stat[1][2];

      // args:
      //    [ [ 'string', 'program' ],
      //      [ 'array', [ [Object], [Object] ] ],
      //      [ 'function', null, [ 'require' ], [] ] ]
      if (args[1] && (args[1][0] == 'array')) {

        // args[1]:
        //   [ 'array', [ [ 'string', 'a' ], [ 'string', 'b' ] ] ]
        deps = (deps || []).concat(args[1][1].map(function(item) {
          return item[1];
        }));

      }

      break;
    }
  }

  return deps;
}


function generateCode(ast, info, compress) {
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
        args.unshift(['array', info.deps.map(function(item) {
          return ['string', item];
        })]);
      }

      if (args.length === 2 && info.name) {
        args.unshift(['string', info.name]);
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


/**
 * The public api for extract.
 */
exports.run = run;


/**
 * Gets module dependencies.
 */
exports.getDependencies = getDependencies;
