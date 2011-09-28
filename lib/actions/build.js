// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm build (port from sbuild).
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fsExt');
var CONFIG = require('../config');
var Compressor = require('../utils/Compressor');
var Combo = require('../utils/Combo');
var ActionFactory = require('./ActionFactory');


var Build = ActionFactory.create('Build');


Build.prototype.AVAILABLE_OPTIONS = {
  clear: {
    alias: ['--clear']
  },
  combo: {
    alias: ['--combo']
  },
  comboAll: {
    alias: ['--comboAll']
  },
  configFile: {
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
  var configFile = (options.configFile || [])[0];
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
          file !== CONFIG.DEFAULT_BUILD_DIR) {
        firstRun = false;
        build(fs.readdirSync(filepath), path.dirname(filepath));
      }
      else {
        console.log(file + ' is not a valid file or directory.');
      }
    });
  }


  function buildFile(filepath) {
    if (options.combo || options.comboAll) {
      Combo.run(filepath, 'auto', options.comboAll, configFile);
    }
    else {
      var outfile = Compressor.compress(filepath, null, { 'compress': true });
      console.log('Successfully build to ' +
          fsExt.relative(process.cwd(), outfile));
    }
  }
};


function clear(basedir) {
  fs.readdirSync(basedir).forEach(function(item) {
    var p = path.join(basedir, item);
    if (item === CONFIG.DEFAULT_BUILD_DIR) {
      fsExt.rmdirRF(p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        clear(p);
      }
    }
  });
}


function getDefaultOutputPath(inputFile, config) {
  var outputDir = path.join(path.dirname(inputFile), config['BUILD_DIR']);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}


module.exports = Build;
