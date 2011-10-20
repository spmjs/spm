/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('./fsExt');
var Dependences = require('./Dependences');
var Compressor = require('./Compressor');
var LoaderConfig = require('./LoaderConfig');

const COMBO_DIR = '__spm_combo_files';


var Combo = exports;


Combo.compile = function(inputFile, outputFile, config) {

  // config: { charset, combine_all, libs_path, loader_config }
  config || (config = {});
  var charset = config.charset || 'utf8';

  var files = getAllDependenciesFiles(inputFile, config);

  var tmpdir = path.join(path.dirname(inputFile), COMBO_DIR);
  fsExt.mkdirS(tmpdir);

  var compressedFiles = files.map(function(file) {
    var compressFile = path.join(tmpdir, path.basename(file));

    Compressor.compress(
        file,
        compressFile,
        {
          'charset': charset,
          'from': inputFile,
          "libs_path": config.libs_path
        }
    );

    return compressFile;
  });

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

  var LIBS_PATH = config.libs_path;
  var basedir = path.dirname(filepath);
  var deps = Dependences.parse(filepath, config.charset);
  var alias;

  if (config.loader_config) {
    alias = LoaderConfig.parseAlias(config.loader_config);
  }

  // self first
  ret.push(filepath);

  deps.forEach(function(id) {
    if (alias) {
      id = parseAlias(id, alias);
    }

    // remove timestamp etc.
    id = id.replace(/\?.*/, '');

    if (config.combine_all || isRelativeId(id)) {
      var p = id;

      if (isRelativeId(id)) {
        p = path.join(basedir, id);
      }
      else if (isTopLevelId(id) && config.combine_all && LIBS_PATH) {
        p = path.join(LIBS_PATH, id);
      }

      if (!path.existsSync(p)) {
        p += '.js';
      }

      if (!path.existsSync(p) || fs.statSync(p).isDirectory()) {
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


function isAbsoluteId(id) {
  return id.charAt(0) === '/' ||
      id.indexOf('://') !== -1 ||
      id.indexOf(':\\') !== -1;
}


function isRelativeId(id) {
  return id.indexOf('./') === 0 ||
      id.indexOf('../') === 0;
}


function isTopLevelId(id) {
  return !isAbsoluteId(id) &&
      !isRelativeId(id);
}


// sync with seajs/src/util-helper.js:parseAlias
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
