/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('./fsExt');
var Alias = require('./Alias');
var Dependences = require('./Dependences');

const COMBO_DIR = '__spm_combo_files';


var Combo = exports;

Combo.combine = function(inputFile, outputFile, config) {

  // config: { charset, comboAll, MODULES_DIR }
  config || (config = {});

  var files = getAllDependenciesFiles(inputFile, config.comboAll);

  var tmpdir = path.join(path.dirname(inputFile), COMBO_DIR);
  util.mkdirS(tmpdir);

  var extractedFiles = files.map(function(file) {
    var out = path.join(tmpdir, path.basename(file));
    return extract.run(file, out, {
      'compress': true,
      'depsOnly': false,
      'baseFile': inputFile
    });
  });


  var out = getComboCode(extractedFiles);
  var ret = out;

  if (outputFile) {
    fs.writeFileSync(outputFile, out, 'utf-8');
    console.log('Successfully combo to ' + path.relative(process.cwd(), outputFile));
    ret = outputFile;
  }
  else {
    console.log(out);
  }

  util.rmdirRF(tmpdir);
  return ret;
};


function getAllDependenciesFiles(filepath, config, ret) {
  ret = ret || [];

  // Only handle js modules.
  if (path.extname(filepath) !== '.js') {
    return ret;
  }

  var MODULES_DIR = config.MODULES_DIR;
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
      else if (MODULES_DIR && isTopLevelId(id)) {
        p = path.join(MODULES_DIR, id);
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


function getComboCode(files) {
  return files.map(
      function(file) {
        return fs.readFileSync(file, 'utf-8');
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
