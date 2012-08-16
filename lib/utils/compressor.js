/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

var Dependences = require('./dependences.js');
var Ast = require('./ast.js');
var env = require('./env.js');

var Compressor = exports;

Compressor.compress = function(inputFile, outputFile, config, meta) {

  // config: { charset, root_path, root_url, compiler_options }
  config || (config = {});
  if (!config.charset) config.charset = 'utf8';

  // get meta info
  meta = meta || getMeta(inputFile, config);

  // generate code
  var code = fs.readFileSync(inputFile, config.charset);
  var ast = jsp.parse(code);
  var out = generateCode(ast, meta, config.compiler_options);

  // output
  if (outputFile) {
    fs.writeFileSync(outputFile, out, config.charset);
    console.log('  ... process ' + path.relative(process.cwd(), inputFile));
  }

  return out;
};


function getMeta(inputFile, config) {
  config || (config = {});
  var meta = {};
  var hasConditional = !!(config.compiler_options || 0).defines;
  var tmpFile = inputFile;

  if (hasConditional) {
    tmpFile = conditionalCompress(inputFile, config);
  }

  meta.deps = Dependences.parse(tmpFile, config.charset);
  meta.id = getId(inputFile, config);

  if (hasConditional) {
    fs.unlinkSync(tmpFile);
  }

  return meta;
}


function conditionalCompress(inputFile, config) {
  var outputFile = inputFile + '.spm_tmp_file';
  var options = config.compiler_options;
  var previous = options.except;

  options.except = ['require'];
  Compressor.compress(inputFile, outputFile, config, {});
  options.except = previous;

  return outputFile;
}


function getId(inputFile, config) {
  var id = '';

  var rootPath = config.root_path || inputFile;
  var rootUrl = config.root_url;

  if (rootUrl) {
    id = getRelativeId(rootPath, inputFile);
    id = path.join(rootUrl, id);

    id = env.normalizePath(id);
    id = id.replace(':/', '://');
  }

  return id;
}


/* for node >=0.5.5 */
function getRelativeId(from, to) {
  // if from is    '/path/to/abc/'
  // when to is    '/path/to/abc/sub/a.js'
  // then return   'sub/a.js'
  // when to is    '/path/to/xyz/c.js'
  // then return   '../xyz/c.js'

  if (fs.statSync(from).isFile()) {
    from = path.dirname(from);
  }
  return path.relative(from, to);
}


function generateCode(ast, meta, options) {
  var times = 0;

  ast = Ast.walk(ast, 'stat', function(stat) {
    if (stat.toString().indexOf('stat,call,name,define,') !== 0) {
      return stat;
    }

    if (++times > 1) {
      // Found multiple "define" in one module file. Only handle the first one.
      return;
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

  ast = pro.ast_mangle(ast, options);
  ast = pro.ast_squeeze(ast, options);
  return pro.gen_code(ast, options) + ';';
}


Compressor._getMeta = getMeta;
