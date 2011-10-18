/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fsExt');
var Compressor = require('../utils/Compressor');
var Combo = require('../utils/Combo');
var ActionFactory = require('./ActionFactory');


var Build = ActionFactory.create('Build');


Build.AVAILABLE_OPTIONS = {
  clear: {
    alias: ['--clear'],
    description: 'Clear all built files.'
  },
  combine: {
    alias: ['--combine'],
    description: 'Combine dependences to one file.'
  },
  combine_all: {
    alias: ['--combine_all'],
    description: 'Combine dependences including libs modules to one file.'
  },
  config: {
    alias: ['--config'],
    length: 1,
    description: 'Specify the path of the build config file.'
  },
  libs_path: {
    alias: ['--libs_path'],
    length: 1,
    description: 'Specify the path of libraries.'
  },
  loader_config: {
    alias: ['--loader_config'],
    length: 1,
    description: 'Specify the path of the loader config file.'
  },
  recursive: {
    alias: ['-r', '--recursive'],
    description: 'Recursively build all files in directories and subdirectories.'
  }
  /*, ONLY support utf8 now, due to UglifyJS.
   charset: {
   alias: ['--charset'],
   length: 1
   }*/
};


Build.CONFIG = {
  BUILD_DIR: '__build',
  BUILD_CONFIG_FILE: 'build-config.js'
};


Build.MESSAGE = {
  USAGE: 'Usage: spm build [options] module',

  DESCRIPTION: 'Build a module.',

  CLEARING: '  ... clearing %s',

  REMOVED: '  %s is removed.',

  NO_SUCH_CONFIG: '\nNo such build config file: ',

  META_INVALID: 'The meta object must have this property: ',

  NO_SUCH: '\nNo such file or directory: ',

  BUILDING: '  Building %s'
};


var CONFIG = Build.CONFIG;
var MESSAGE = Build.MESSAGE;


Build.prototype.run = function() {
  var options = this.options;
  var cwd = process.cwd();

  // spm build --clear
  if (options.clear) {
    console.log(MESSAGE.CLEARING, path.basename(cwd));
    this.clear(cwd);
    console.log(MESSAGE.REMOVED, CONFIG.BUILD_DIR);
    return;
  }

  var modules = this.modules;
  if (modules.length === 0) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    return -1;
  }

  // parse build config
  parseBuildConfig(options);

  // build files
  var charset = options.charset || 'utf8';
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
          file !== CONFIG.BUILD_DIR) {
        firstRun = false;
        build(fs.readdirSync(filepath), filepath);
      }
      else if (firstRun) {
        throw MESSAGE.NO_SUCH + file;
      }
    });
  }


  function buildFile(inputFile) {
    console.log(MESSAGE.BUILDING, inputFile);
    var outputFile = getOutputPath(inputFile);

    // spm build a.js --combine
    if (options.combine || options.combine_all) {
      Combo.compile(
          inputFile,
          outputFile,
          {
            'charset': charset,
            "combine_all": options.combine_all,
            "libs_path": options.libs_path,
            "loader_config": options.loader_config
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
            "libs_path": options.libs_path
          }
      );
    }
  }
};


Build.prototype.clear = function(basedir) {
  fs.readdirSync(basedir).forEach(function(item) {
    var p = path.join(basedir, item);
    if (item === CONFIG.BUILD_DIR) {
      fsExt.rmdirRF(p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        Build.prototype.clear(p);
      }
    }
  });
};


function parseBuildConfig(options) {
  var configFile = options.config;
  if (configFile && !path.existsSync(configFile)) {
    throw MESSAGE.NO_SUCH_CONFIG + configFile;
  }

  var buildConfig = {};
  configFile = path.resolve(configFile || CONFIG.BUILD_CONFIG_FILE);
  if (path.existsSync(configFile)) {
    buildConfig = require(configFile);
  }

  options.libs_path = normalizePath(
      options.libs_path,
      buildConfig.libs_path,
      configFile
  );

  options.loader_config = normalizePath(
      options.loader_config,
      buildConfig.loader_config,
      configFile
  );

  validatePath(options.libs_path);
  validatePath(options.loader_config);
}


function normalizePath(path1, path2, configFile) {
  var p = '';

  if (path1) {
    p = path.resolve(path1);
  }
  else if (path2) {
    p = path.resolve(path.dirname(configFile), path2);
  }

  return p;
}


function validatePath(filepath) {
  if (filepath && !path.existsSync(filepath)) {
    throw MESSAGE.NO_SUCH + filepath;
  }
}


function isJSFile(filepath) {
  return path.extname(filepath) === '.js';
}


function getOutputPath(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), CONFIG.BUILD_DIR);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}


module.exports = Build;
