/**
 * @fileoverview spm build.
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fsExt');
var Compressor = require('../utils/Compressor');
var Combo = require('../utils/Combo');
var ActionFactory = require('./ActionFactory');

const BUILD_DIR = '__build';
const BUILD_CONFIG_FILE = 'build-config.js';


var Build = ActionFactory.create('Build');


Build.prototype.AVAILABLE_OPTIONS = {
  clear: {
    alias: ['--clear']
  },
  combo: {
    alias: ['--combo']
  },
  comboAll: {
    alias: ['--combo_all']
  },
  config: {
    alias: ['--config'],
    length: 1
  },
  libs: {
    alias: ['--libs'],
    length: 1
  },
  recursive: {
    alias: ['-r', '--recursive']
  }
  /*, ONLY support utf-8 now, due to UglifyJS.
   charset: {
   alias: ['--charset'],
   length: 1
   }*/
};


Build.prototype.run = function() {
  var options = this.options;
  var cwd = process.cwd();

  // spm build --clear
  if (options.clear) {
    console.log('  ... clearing ' + path.basename(cwd));
    this.clear(cwd);
    console.log('  \'' + BUILD_DIR + '\' is removed');
    return;
  }

  var modules = this.modules;
  if (modules.length == 0) {
    return;
  }

  // get build config
  var buildConfigFile = options.config;
  if (buildConfigFile && !path.existsSync(buildConfigFile)) {
    throw 'No such build config file: ' + buildConfigFile;
  }
  buildConfigFile = buildConfigFile || BUILD_CONFIG_FILE;

  var buildConfig = {};
  if (path.existsSync(buildConfigFile)) {
    buildConfig = require(buildConfigFile);
  }

  // get libs path
  var libs = getLibsPath(options, buildConfig, buildConfigFile);
  if (libs && !path.existsSync(libs)) {
    throw 'No such libs directory: ' + libs;
  }

  // build files
  var charset = options.charset || 'utf-8';
  var firstRun = true;
  build(modules, cwd);


  function build(files, basedir) {

    files.forEach(function(file) {
      var filepath = path.resolve(basedir, file);
      var stat = fs.statSync(filepath);

      // spm build a.js
      if (stat.isFile() && isJSFile(filepath)) {
        buildFile(filepath);
      }
      // spm build folder
      else if (stat.isDirectory() &&
          (firstRun || options.recursive) &&
          file !== BUILD_DIR) {
        firstRun = false;
        build(fs.readdirSync(filepath), filepath);
      }
      else if (firstRun) {
        throw 'No such file or directory: ' + file;
      }
    });
  }


  function buildFile(inputFile) {
    console.log('  build ' + inputFile);
    var outputFile = getOutputPath(inputFile);

    // spm build a.js --combo
    if (options.combo || options.comboAll) {
      Combo.compile(
          inputFile,
          outputFile,
          {
            'charset': charset,
            'comboAll': options.comboAll,
            'libs': libs
          }
      );
    }
    // spm build a.js
    else {
      Compressor.compress(
          inputFile,
          outputFile,
          {
            'charset': charset,
            'from': inputFile,
            'libs': libs
          }
      );
    }
  }
};


Build.prototype.clear = function(basedir) {
  fs.readdirSync(basedir).forEach(function(item) {
    var p = path.join(basedir, item);
    if (item === BUILD_DIR) {
      fsExt.rmdirRF(p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        Build.prototype.clear(p);
      }
    }
  });
};


function getLibsPath(options, buildConfig, buildConfigFile) {
  var result = options.libs || buildConfig.libs;

  if (result) {
    result = path.resolve(
        options.libs ? process.cwd() : path.dirname(buildConfigFile),
        result
    );
  }
  return result;
}


function isJSFile(filepath) {
  return path.extname(filepath) === '.js';
}


function getOutputPath(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), BUILD_DIR);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}


module.exports = Build;
