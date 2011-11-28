/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Compressor = require('../utils/compressor.js');
var Combo = require('../utils/combo.js');
var ActionFactory = require('./action_factory.js');
var Options = require('../utils/options.js');
var LoaderConfig = require('../utils/loader_config.js');

var OPTION_TYPES = Options.TYPES;


var Build = ActionFactory.create('Build');


Build.AVAILABLE_OPTIONS = {
  clear: {
    alias: ['--clear'],
    description: 'Clear all built files.',
    type: OPTION_TYPES.BOOL
  },
  combine: {
    alias: ['--combine'],
    description: 'Combine dependences to one file.',
    type: OPTION_TYPES.BOOL
  },
  combine_all: {
    alias: ['--combine_all'],
    description: 'Combine dependences including base modules to one file.',
    type: OPTION_TYPES.BOOL
  },
  excludes: {
    alias: ['--excludes'],
    length: 1,
    description: 'A RegExp. When the file path of a module matches this regexp, the module will be excluded during combining.',
    type: OPTION_TYPES.REGEXP
  },
  base_path: {
    alias: ['--base_path'],
    length: 1,
    description: 'Specify the root directory of base modules.',
    type: OPTION_TYPES.PATH
  },
  app_path: {
    alias: ['--app_path'],
    length: 1,
    description: 'Specify the root directory of app modules.',
    type: OPTION_TYPES.PATH
  },
  app_url: {
    alias: ['--app_url'],
    length: 1,
    description: 'Specify the root URL of app modules.',
    type: OPTION_TYPES.URL
  },
  config: {
    alias: ['--config'],
    length: 1,
    description: 'Specify the path of the build config file.',
    type: OPTION_TYPES.PATH
  },
  loader_config: {
    alias: ['--loader_config'],
    length: 1,
    description: 'Specify the path of the loader config file.',
    type: OPTION_TYPES.PATH
  },
  recursive: {
    alias: ['-r', '--recursive'],
    description: 'Recursively build all files in directories and subdirectories.',
    type: OPTION_TYPES.BOOL
  }
  /*, ONLY support utf8 now, due to UglifyJS.
   charset: {
   alias: ['--charset'],
   length: 1,
   type: OPTION_TYPES.STRING
   }*/
};


Build.CONFIG = {
  BUILD_DIR: '__build',
  BUILD_CONFIG_FILE: 'build-config.js'
};


Build.MESSAGE = {
  USAGE: 'Usage: spm build [options] module',

  DESCRIPTION: 'Build a module.',

  REMOVED: '  Removed: %s',

  BUILDING: '  Building %s'
};


var CONFIG = Build.CONFIG;
var MESSAGE = Build.MESSAGE;


Build.prototype.run = function() {
  var instance = this;
  var modules = this.modules;
  var options = this.options;

  // spm build --clear
  if (options.clear) {
    instance.clear();
    return;
  }

  // spm build
  if (modules.length === 0) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    return;
  }

  // prepare options
  var configFile = path.resolve(options.config || CONFIG.BUILD_CONFIG_FILE);
  if (path.existsSync(configFile)) {
    Options.mergeFromConfigFile(configFile, options, Build.AVAILABLE_OPTIONS);
  }
  Options.normalize(options, Build.AVAILABLE_OPTIONS);

  // spm build modules
  var firstRun = true;
  build(modules, process.cwd());

  function build(items, root) {

    items.forEach(function(item) {
      var filepath = path.resolve(root, item);
      var stat = fs.statSync(filepath);

      // spm build a.js
      if (stat.isFile() && isJSFile(filepath)) {
        instance.build(filepath);
      }
      // spm build folder
      else if (stat.isDirectory() &&
          (firstRun || options.recursive) &&
          item !== CONFIG.BUILD_DIR) {
        firstRun = false;
        build(fs.readdirSync(filepath), filepath);
      }
    });
  }
  
};


Build.prototype.clear = function(root) {
  root = root || this.modules[0] || process.cwd();

  fs.readdirSync(root).forEach(function(item) {
    var p = path.join(root, item);

    if (item === CONFIG.BUILD_DIR) {
      fsExt.rmdirRF(p);
      console.log(MESSAGE.REMOVED, p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        Build.prototype.clear(p);
      }
    }
  });

};


Build.prototype.build = function(inputFile) {
  console.log(MESSAGE.BUILDING, inputFile);

  var outputFile = getOutputPath(inputFile);
  var options = this.options;

  // spm build a.js --combine
  if (options.combine || options.combine_all) {

    var alias = {};
    if (options.loader_config) {
      alias = LoaderConfig.parseAlias(options.loader_config)
    }

    Combo.compile(
        inputFile,
        outputFile,
        {
          'combine_all': options.combine_all,
          'base_path': options.base_path,
          'app_path': options.app_path,
          'app_url': options.app_url,
          'alias': alias,
          'excludes': options.excludes
        }
    );
  }
  // spm build a.js
  else {
    Compressor.compress(
        inputFile,
        outputFile,
        {
          'root_path': options.app_path,
          'root_url': options.app_url
        }
    );
  }
};


function isJSFile(filepath) {
  return path.extname(filepath) === '.js';
}


function getOutputPath(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), CONFIG.BUILD_DIR);
  fsExt.mkdirS(outputDir);
  return path.join(outputDir, path.basename(inputFile));
}


module.exports = Build;
