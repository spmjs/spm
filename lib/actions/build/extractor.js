/**
 * @fileoverview Parses module name and dependencies.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');

//var util = require('./util');


function extract(inputFile, outputFile, config) {
  inputFile = util.normalize(inputFile);
  config = config || {};

  var info = extractInfo(inputFile,
      config['baseFile'] || path.join(process.cwd(), 'INDEX'),
      config['depsOnly'] !== false);

  var code = fs.readFileSync(inputFile, 'utf-8');
  var ast = uglifyjs.parser.parse(code);
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
    console.log(out);
    return out;
  }
}


function extractInfo(inputFile, baseFile, depsOnly) {
  var info = {};

  info.deps = getDependencies(inputFile);

  if (!depsOnly) {
    var name;

    // top-level modules
    if (inputFile.indexOf(config.MODULES_DIR) === 0) {
      name = inputFile.substring(config.MODULES_DIR.length + 1);
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
        for (var j = i; j < parts.length; j++) {
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


function getDependencies(inputFile) {
  var code = fs.readFileSync(inputFile, 'utf-8');
  var ast = uglifyjs.parser.parse(code);
  return getAstDependencies(ast);
}


function getAstDependencies(ast) {
  return getStaticDependencies(ast) || getDynamicDependencies(ast);
}


function getStaticDependencies(ast) {
  var deps;

  // only handle two cases:
  //  define(['b'], function(){}) ==>
  //     stat,call,name,define,array,string,b,function,,...
  //  define('a', ['b], function(){}) ==>
  //    stat,call,name,define,string,a,array,string,b,function,,...

  // NOTICE: the id and deps MUST be literal, the function can be a reference.
  //  define(['b'], xx) ==>
  //    stat,call,name,define,array,string,b,name,xx...

  var pattern = /,stat,call,name,define,.*,array(,.*,)(?:function|name),/;
  var match = ast.toString().match(pattern);

  if (match && match[1]) {
    deps = [];
    var t = match[1].match(/,string,[^,]+/g);

    if (t && t.length) {
      deps = t.map(function(s) {
        // s: ,string,xxx
        return s.slice(8);
      });
    }
  }

  return deps;
}


function getDynamicDependencies(ast) {
  var deps = [];

  // get dependencies
  // require('a') ==> call,name,require,string,a

  var pattern = /,call,name,require,string,([^,]+)(?:,|$)/g;
  var text = ast.toString();
  var match;
  while ((match = pattern.exec(text))) {
    if (deps.indexOf(match[1]) === -1) {
      deps.push(match[1]);
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
exports.extract = extract;


/**
 * Gets module dependencies.
 */
exports.getDependencies = getDependencies;


/**
 * Gets module dependencies by ast.
 */
exports.getAstDependencies = getAstDependencies;
