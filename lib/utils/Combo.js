/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('./fsExt');
var Dependences = require('./Dependences');
var Compressor = require('./Compressor');

const COMBO_DIR = '__spm_combo_files';


var Combo = exports;


Combo.compile = function(inputFile, outputFile, config) {

  // config: { charset, comboAll, libs }
  config || (config = {});
  var charset = config.charset || 'utf-8';

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
          'libs': config.libs
        }
    );

    return compressFile;
  });

  var out = getComboCode(compressedFiles, charset);

  if (outputFile) {
    fs.writeFileSync(outputFile, out, charset);
    console.log('  Successfully combo to ' +
        path.relative(process.cwd(), outputFile));
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

  var LIBS_PATH = config.libs;
  var basedir = path.dirname(filepath);
  var deps = Dependences.parse(filepath, config.charset);

  deps.forEach(function(id) {
    // remove timestamp etc.
    id = id.replace(/\?.*/, '');

    if (config.comboAll || isRelativeId(id)) {
      var p = id;

      if (isRelativeId(id)) {
        p = path.join(basedir, id);
      }
      else if (isTopLevelId(id) && config.comboAll && LIBS_PATH) {
        p = path.join(LIBS_PATH, id);
      }

      if (!path.existsSync(p)) {
        p += '.js';
        if (!path.existsSync(p)) {
          throw 'This file does not exist: ' + p;
        }
      }

      if (ret.indexOf(p) === -1) {
        getAllDependenciesFiles(p, config, ret);
      }
    }
  });

  ret.push(filepath);
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
