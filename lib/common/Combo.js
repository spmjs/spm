
/**
 * @fileoverview Combine module and its relative dependencies to one file.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('../../util/fsExt');
var Alias = require('../../util/Alias');
var CONFIG = require('../../config');

const COMBO_DIR = '__combo_files';


function run(inputFile, outputFile, comboAll, configFile) {
  inputFile = util.normalize(inputFile);
  configFile = getConfigFile(inputFile, configFile);

  var files = getAllDependenciesFiles(inputFile, comboAll, configFile);

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
    if (outputFile == 'auto') {
      outputFile = util.getDefaultOutputFilepath(inputFile);
    }
    fs.writeFileSync(outputFile, out, 'utf-8');
    console.log('Successfully combo to ' + path.relative(process.cwd(), outputFile));
    ret = outputFile;
  }
  else {
    console.log(out);
  }

  util.rmdirRF(tmpdir);
  return ret;
}


function getAllDependenciesFiles(filepath, comboAll, configFile, ret) {
  ret = ret || [];
  // Only handler js modules.
  if (path.extname(filepath) !== '.js') {
    return ret;
  }

  ret.push(filepath);

  var basedir = path.dirname(filepath);
  var deps = extract.getDependencies(filepath);
  if (configFile) {
    deps = alias.parse(deps, configFile);
  }

  deps.forEach(function(id) {
    id = id.replace(/\?.*/, ''); // remove timestamp etc.

    if (comboAll || fsExt.isRelativePath(id)) {
      var p = id;

      if (fsExt.isRelativePath(id)) {
        p = path.join(basedir, id);
      }
      else if (fsExt.isTopLevelPath(id)) {
        p = path.join(config.modulesDir, id);
      }

      if (!path.existsSync(p)) {
        p += '.js';
        if (!path.existsSync(p)) {
          throw 'This file doesn\'t exist: ' + p;
        }
      }

      if (ret.indexOf(p) === -1) {
        getAllDependenciesFiles(p, comboAll, configFile, ret);
      }
    }
  });

  return ret;
}


function getComboCode(files) {
  return files.map(
      function(file) {
        return fs.readFileSync(file, 'utf-8');
      }).join('\n');
}


function getConfigFile(inputFile, configFile) {
  if (!configFile) {
    configFile = path.join(path.dirname(inputFile), 'app-config.js');
  }
  if (path.existsSync(configFile)) {
    configFile = util.normalize(configFile);
  } else {
    configFile = '';
  }
  return configFile;
}


/**
 * The public api of combo.js.
 */
exports.run = run;
