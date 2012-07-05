/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('./fs_ext.js');
var Dependences = require('./dependences.js');
var Compressor = require('./compressor.js');


const COMBO_DIR = '__spm_combo_files';


var Combo = exports;


Combo.compile = function(inputFile, outputFile, config) {
  // config: { charset, combine_all, base_path, app_path, app_url, alias, excludes, compiler_options }
  config || (config = {});

  var charset = config.charset || 'utf8';
  var appPath = config.app_path || inputFile;
  var appUrl = config.app_url;
  var excludes = config.excludes;
  var compilerOptions = config.compiler_options;

  // Make sure appUrl exists
  if (!appUrl) {
    throw '     ** Can not find "app_url" in config.\n';
  }

  // Get all dependency files
  var files = getAllDependenciesFiles(inputFile, config);
  if (excludes) {
    files = files.filter(function(file) {
      return !excludes.test(file);
    });
  }

  // Compress all files in tmp directory
  var tmpdir = path.join(path.dirname(inputFile), COMBO_DIR);
  fsExt.mkdirS(tmpdir);

  var compressedFiles = files.map(function(file) {
    var compressFile = path.join(tmpdir, path.relative(process.cwd(), file));
    fsExt.mkdirS(path.dirname(compressFile));
    Compressor.compress(
        file,
        compressFile,
        {
          'charset': charset,
          'root_path': appPath,
          'root_url': appUrl,
          'compiler_options': compilerOptions
        }
    );
    return compressFile;
  });

  // Output result
  var out = getComboCode(compressedFiles, charset);

  if (outputFile) {
    fs.writeFileSync(outputFile, out, charset);
    console.log('  Combined to ' + path.relative(process.cwd(), outputFile));
  }

  fsExt.rmdirRF(tmpdir);
  return out;
};


function getAllDependenciesFiles(filepath, config, ret) {
  ret = ret || [];

  // Only handle js modules.
  if (path.extname(filepath) !== '.js') {
    return ret;
  }

  var BASE_PATH = config.base_path;
  var root = path.dirname(filepath);
  var deps = Dependences.parse(filepath, config.charset);

  // self first
  ret.push(filepath);

  deps.forEach(function(id) {
    id = parseAlias(id, config.alias);

    // remove timestamp etc.
    id = id.replace(/\?.*/, '');

    if (config.combine_all || isRelative(id)) {
      var p = id;

      if (isRelative(id)) {
        p = path.join(root, id);
      }
      else if (isTopLevel(id) && config.combine_all && BASE_PATH) {
        p = path.join(BASE_PATH, id);
      }

      if (!fs.existsSync(p)) {
        p += '.js';
      }

      if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        throw 'No such file: ' + p;
      }

      if (ret.indexOf(p) === -1) {
        getAllDependenciesFiles(p, config, ret);
      }
    }
  });

  return ret;
}


function getComboCode(files, charset) {
  return files.map(
      function(file) {
        return fs.readFileSync(file, charset);
      }).join('\n');
}


// sync with seajs/src/util-path.js:parseAlias
function parseAlias(id, alias) {
  // #xxx means xxx is parsed.
  if (id.charAt(0) === '#') {
    return id.substring(1);
  }

  // Only top-level id needs to parse alias.
  if (isTopLevel(id) && alias) {

    var parts = id.split('/');
    var first = parts[0];

    var has = alias.hasOwnProperty(first);
    if (has) {
      parts[0] = alias[first];
      id = parts.join('/');
    }
  }

  return id;
}


function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0;
}


function isTopLevel(id) {
  var c = id.charAt(0);
  return id.indexOf('://') === -1 && c !== '.' && c !== '/';
}
