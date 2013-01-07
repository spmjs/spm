var fs = require('fs');
var UglifyJS = require('uglify-js');
var util = require('util');

var fsExt = require('../utils/fs_ext.js');

var options;

var compressorOptions = {
  sequences     : true,  // join consecutive statemets with the “comma operator”
  properties    : true,  // optimize property access: a["foo"] → a.foo
  dead_code     : true,  // discard unreachable code
  drop_debugger : true,  // discard “debugger” statements
  unsafe        : false,  // some unsafe optimizations (see below)
  conditionals  : true,  // optimize if-s and conditional expressions
  comparisons   : true,  // optimize comparisons
  evaluate      : true,  // evaluate constant expressions
  booleans      : true,  // optimize boolean expressions
  loops         : true,  // optimize loops
  unused        : true,  // drop unused variables/functions
  hoist_funs    : true,  // hoist function declarations
  hoist_vars    : false, // hoist variable declarations
  if_return     : true,  // optimize if-s followed by return/continue
  join_vars     : true,  // join var declarations
  cascade       : true,  // try to cascade `right` into `left` in sequences
  side_effects  : true,  // drop side-effect-free statements
  warnings      : true,   // warn about potentially dangerous optimizations/code
  global_defs   : {}     // global definitions
};

var codegenOptions = {
  indent_start  : 0,     // start indentation on every line (only when `beautify`)
  indent_level  : 4,     // indentation level (only when `beautify`)
  quote_keys    : false, // quote all keys in object literals?
  space_colon   : true,  // add a space after colon signs?
  ascii_only    : false, // output ASCII-safe? (encodes Unicode characters as ASCII)
  inline_script : false, // escape "</script"?
  width         : 80,    // informative maximum line width (for beautified output)
  max_line_len  : 32000, // maximum line length (for non-beautified output)
  ie_proof      : true,  // output IE-safe code?
  beautify      : false, // beautify output?
  //source_map    : null,  // output a source map
  bracketize    : false, // use brackets every time?
  comments      : false, // output comments?
  semicolons    : true,  // use semicolons to separate statements? (otherwise, newlines)
};

var reserved = false;
module.exports = function(file_path, callback, project) {
  parse_opts(project.getConfig('compressOptions'));

  // 代码压缩.
  callback(compress(file_path)); // compressed code here
};

var compress = module.exports.compress = function(file_path) {
  var code = fsExt.readFileSync(file_path);

  var ast = UglifyJS.parse(code, {
    filename: file_path
  });

  ast.figure_out_scope();
  //ast.compute_char_frequency();

  //TODO 是否压缩命名判断.  
  if (!reserved) {
    ast.mangle_names();
  }

  var compressor = UglifyJS.Compressor(compressorOptions); // get a new AST with mangled names
  ast = ast.transform(compressor);
  code = ast.print_to_string(codegenOptions);
 
  return code;
};

var alias = {
   "p": "prefix"
 , "b": "beautify"
 , "m": "mangle"
 , "d": "define"
 , "r": "reserved"
};

var parsed = false;
function parse_opts(args) {

  if (parsed) {
    return;
  }

  if (typeof args !== 'string') {
    args = '';
  }

  args = args.split(',');
  var hasValueParams = ['indent_start', 'indent_level', 'width', 'max_line_len'];
  var ingoreParams = ['global_defs', 'source_map'];
//console.info('args------>', args.shift(), options);
  out:while (args.length > 0) {
    var key = args.shift();
    key = alias[key] || key;
    var value;

    if (hasValueParams.indexOf(key) > -1) {
      key = args.shift();
    }

    if (key in compressorOptions) {
      compressorOptions[key] = !compressorOptions[key];
    }

    if (key in codegenOptions) {
      codegenOptions[key] = !codegenOptions[key]; 
    }

    if (key === 'reserved') {
      reserved = true;
    }

    if (ingoreParams.indexOf(key) > -1) {
      console.warn('暂时不支持此参数:' + key);
    }
  }

  parsed = true;
}
