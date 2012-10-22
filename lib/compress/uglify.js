var fs = require('fs');
var uglifyjs = require('uglify-js');
var util = require('util');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

var argv = require('optimist').argv;
var options;
module.exports = function(path, callback) {
  // 代码压缩.
  var code = fs.readFileSync(path);
  var ast = jsp.parse(code + ''); // parse code and get the initial AST


  ast = pro.ast_mangle(ast, {
                        mangle       : options.mangle,
                        toplevel     : options.mangle_toplevel,
                        defines      : options.defines,
                        except       : options.reserved_names,
                        no_functions : options.no_mangle_functions
                     }); // get a new AST with mangled names
   ast = pro.ast_squeeze(ast, {
                        make_seqs  : options.make_seqs,
                        dead_code  : options.dead_code,
                        keep_comps : !options.unsafe,
                        unsafe     : options.unsafe
                     });

  code = pro.gen_code(ast, options.codegen_options);

  if (!options.codegen_options.beautify) {
    code += ';';
  }

  /**
    code = pro.split_lines(result, options.max_line_length);
  }
  **/
  callback(code); // compressed code here
};

options = {
        ast: false,
        consolidate: false,
        mangle: true,
        mangle_toplevel: false,
        no_mangle_functions: false,
        squeeze: true,
        make_seqs: true,
        dead_code: true,
        verbose: false,
        show_copyright: true,
        out_same_file: false,
        max_line_length: 32 * 1024,
        unsafe: false,
        reserved_names: null,
        defines: { },
        lift_vars: false,
        codegen_options: {
                ascii_only: false,
                beautify: false,
                indent_level: 4,
                indent_start: 0,
                quote_keys: false,
                space_colon: false,
                inline_script: false
        },
        make: false,
        output: true            // stdout
};

parse_opts();

function parse_opts(args) {
  var args = argv['compress-options']; 
  if (typeof args !== 'string') {
    args = '';
  }

  args = args.split(',');
//console.info('args------>', args.shift(), options);
  out:while (args.length > 0) {
        var v = args.shift();
        switch (v) {
            case "b":
            case "beautify":
                options.codegen_options.beautify = true;
                break;
            case "c":
            case "consolidate-primitive-values":
                options.consolidate = true;
                break;
            case "i":
            case "indent":
                options.codegen_options.indent_level = args.shift();
                break;
            case "q":
            case "quote-keys":
                options.codegen_options.quote_keys = true;
                break;
            case "mt":
            case "mangle-toplevel":
                options.mangle_toplevel = true;
                break;
            case "nmf":
            case "no-mangle-functions":
                options.no_mangle_functions = true;
                break;
            case "no-mangle":
            case "nm":
                options.mangle = false;
                break;
            case "no-squeeze":
            case "ns":
                options.squeeze = false;
                break;
            case "no-seqs":
                options.make_seqs = false;
                break;
            case "no-dead-code":
                options.dead_code = false;
                break;
            case "no-copyright":
            case "nc":
                options.show_copyright = false;
                break;
            case "o":
            case "output":
                options.output = args.shift();
                break;
            case "overwrite":
                options.out_same_file = true;
                break;
            case "v":
            case "verbose":
                options.verbose = true;
                break;
            case "ast":
                options.ast = true;
                break;
            case "unsafe":
                options.unsafe = true;
                break;
            case "max-line-len":
                options.max_line_length = parseInt(args.shift(), 10);
                break;
            case "reserved-names":
                options.reserved_names = args.shift().split(",");
                break;
            case "lift-vars":
                options.lift_vars = true;
                break;
            case "d":
            case "define":
                 var defarg = args.shift();
                 try {
                     var defsym = function(sym) {
                             // KEYWORDS_ATOM doesn't include NaN or Infinity - should we check
                             // for them too ?? We don't check reserved words and the like as the
                             // define values are only substituted AFTER parsing
                             if (jsp.KEYWORDS_ATOM.hasOwnProperty(sym)) {
                                 throw new Error("Don't define values for inbuilt constant '"+sym+"'");
                             }
                             return sym;
                         },
                         defval = function(v) {
                             if (v.match(/^"(.*)"$/) || v.match(/^'(.*)'$/)) {
                                 return [ "string", RegExp.$1 ];
                             }
                             else if (!isNaN(parseFloat(v))) {
                                 return [ "num", parseFloat(v) ];
                             }
                             else if (v.match(/^[a-z\$_][a-z\$_0-9]*$/i)) {
                                 return [ "name", v ];
                             }
                             else if (!v.match(/"/)) {
                                 return [ "string", v ];
                             }
                             else if (!v.match(/'/)) {
                                 return [ "string", v ];
                             }
                             throw new Error("Can't understand the specified value: "+v);
                         };
                     if (defarg.match(/^([a-z_\$][a-z_\$0-9]*)(=(.*))?$/i)) {
                         var sym = defsym(RegExp.$1),
                             val = RegExp.$2 ? defval(RegExp.$2.substr(1)) : [ 'name', 'true' ];
                         options.defines[sym] = val;
                     }
                     else {
                         throw new Error("The --define option expects SYMBOL[=value]");
                     }
                 } catch(ex) {
                     util.print("ERROR: In option --define "+defarg+"\n"+ex+"\n");
                     process.exit(1);
                 }
                 break;
            case "define-from-module":
                var defmodarg = args.shift(),
                    defmodule = require(defmodarg),
                    sym,
                    val;
                for (sym in defmodule) {
                    if (defmodule.hasOwnProperty(sym)) {
                        options.defines[sym] = function(val) {
                            if (typeof val == "string")
                                return [ "string", val ];
                            if (typeof val == "number")
                                return [ "num", val ];
                            if (val === true)
                                return [ 'name', 'true' ];
                            if (val === false)
                                return [ 'name', 'false' ];
                            if (val === null)
                                return [ 'name', 'null' ];
                            if (val === undefined)
                                return [ 'name', 'undefined' ];
                            util.print("ERROR: In option --define-from-module "+defmodarg+"\n");
                            util.print("ERROR: Unknown object type for: "+sym+"="+val+"\n");
                            process.exit(1);
                            return null;
                        }(defmodule[sym]);
                    }
                }
                break;
            case "ascii":
                options.codegen_options.ascii_only = true;
                break;
            case "make":
                options.make = true;
                break;
            case "inline-script":
                options.codegen_options.inline_script = true;
                break;
            default:
                filename = v;
                break out;
        }
  }
}

