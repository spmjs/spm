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
  recursive: {
    alias: ['-r', '--recursive']
  },
  charset: {
    alias: ['--charset'],
    length: 1
  }
};


Build.prototype.run = function() {
  var options = this.options;
  var cwd = process.cwd();

  // spm build --clear
  if (options.clear) {
    console.log('Clearing ' + path.basename(cwd) + '...');
    clear(cwd);
    console.log('Clear successfully.');
    return;
  }

  // spm build file1 file2
  var firstRun = true;
  build(this.modules, cwd);


  function build(files, basedir) {

    files.forEach(function(file) {
      var filepath = path.join(basedir, file);
      var stat = fs.statSync(filepath);

      // spm build a.js
      if (stat.isFile()) {
        buildFile(filepath);
      }
      // spm build folder
      else if (stat.isDirectory() &&
          (firstRun || options.recursive) &&
          file !== BUILD_DIR) {
        firstRun = false;
        build(fs.readdirSync(filepath), path.dirname(filepath));
      }
      else {
        console.log(file + ' is not a valid file or directory.');
      }
    });
  }


  function buildFile(inputFile) {
    var outputFile = getOutputPath(inputFile);

    // spm build a.js --combo
    if (options.combo || options.comboAll) {
      Combo.compile(inputFile, outputFile, {
        'charset': options.charset,
        'comboAll': options.comboAll,
        'base': options.base
      });
    }
    // spm build a.js
    else {
      Compressor.compress(inputFile, outputFile, {
        'charset': options.charset,
        'from': inputFile,
        'base': options.base
      });
    }
  }
};


function clear(basedir) {
  fs.readdirSync(basedir).forEach(function(item) {
    var p = path.join(basedir, item);
    if (item === BUILD_DIR) {
      fsExt.rmdirRF(p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        clear(p);
      }
    }
  });
}


function getOutputPath(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), BUILD_DIR);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}


module.exports = Build;
