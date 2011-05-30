
/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var uglifyjs = require('../support/uglify-js/uglify-js');

var extract = require('./extract');
var util = require('./util');
var config = require('./config');

const COMBO_DIR = '__combo_files';


/**
 * The public api of combo.js.
 * @param {string} inputFile The path of input file.
 * @param {string} outputFile The path of output file.
 * @param {boolean=} comboAll Whether to combo all dependencies.
 * @return {string} The path of output file.
 */
exports.run = function(inputFile, outputFile, comboAll) {
  inputFile = util.normalize(inputFile);
  var files = getAllDependenciesFiles(inputFile, comboAll);

  var tmpdir = path.join(path.dirname(inputFile), COMBO_DIR);
  util.mkdirSilent(tmpdir);

  var extractedFiles = files.map(function(file) {
    var out = path.join(tmpdir, path.basename(file));
    return extract.run(file, out, true, false, inputFile);
  });


  var out = getComboCode(extractedFiles);
  var ret = out;

  if (outputFile) {
    if (outputFile == 'auto') {
      outputFile = util.getDefaultOutputFilepath(inputFile);
    }
    fs.writeFileSync(outputFile, out, 'utf-8');
    console.log('Successfully combo to ' + util.getRelativePath(outputFile));
    ret = outputFile;
  }
  else {
    console.log(out);
  }

  util.rmdirForce(tmpdir);
  return ret;
};


function getAllDependenciesFiles(filepath, comboAll, ret) {
  ret = ret || [];
  // Only handler js modules.
  if (path.extname(filepath) !== '.js') {
    return ret;
  }

  ret.push(filepath);

  var basedir = path.dirname(filepath);
  var deps = getDependencies(filepath);

  deps.forEach(function(id) {
    if (comboAll || util.isRelativeId(id)) {
      var p = id;

      if (util.isRelativeId(id)) {
        p = path.join(basedir, id);
      }
      else if (util.isTopLevelId(id)) {
        p = path.join(config.modulesDir, id);
      }

      if (!path.existsSync(p)) {
        p += '.js';
        if (!path.existsSync(p)) {
          throw 'This file doesn\'t exist: ' + p;
        }
      }

      if (ret.indexOf(p) === -1) {
        getAllDependenciesFiles(p, comboAll, ret);
      }
    }
  });

  return ret;
}


function getDependencies(filepath) {
  var code = fs.readFileSync(filepath, 'utf-8');
  var ast = uglifyjs.parser.parse(code);
  return extract.getDependencies(ast);
}


function getComboCode(files) {
  return files.map(
      function(file) {
        return fs.readFileSync(file, 'utf-8');
      }).join('\n');
}
