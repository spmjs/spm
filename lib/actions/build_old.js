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


var Build = ActionFactory.create('Build');


Build.AVAILABLE_OPTIONS = {
  clear: {
    alias: ['--clear'],
    description: 'clear all built files'
  },
  combine: {
    alias: ['--combine'],
    description: 'combine dependences to one file'
  },
  combine_all: {
    alias: ['--combine_all'],
    description: 'combine dependences including base modules to one file'
  },
  app_url: {
    alias: ['--app_url'],
    length: 1,
    description: 'specify the root URL of app modules'
  },
  app_path: {
    alias: ['--app_path'],
    length: 1,
    description: 'specify the root directory of app modules',
    ispath: true
  },
  base_path: {
    alias: ['--base_path'],
    length: 1,
    description: 'specify the root directory of base modules',
    ispath: true
  },
  out_path: {
    alias: ['--out_path'],
    length: 1,
    description: 'specify the root directory of built modules',
    ispath: true
  },
  config: {
    alias: ['--config'],
    length: 1,
    description: 'specify the path of the build config file',
    ispath: true
  },
  loader_config: {
    alias: ['--loader_config'],
    length: 1,
    description: 'specify the path of the loader config file',
    ispath: true
  },
  recursive: {
    alias: ['-r', '--recursive'],
    description: 'recursively build all files in directories and subdirectories'
  },
  excludes: {
    alias: ['--excludes'],
    length: 1,
    description: 'exclude those modules whose paths match this regexp'
  },
  compiler_options: {
    alias: ['--compiler_options'],
    length: 1,
    description: 'the options passed to the internal compiler'
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
  USAGE: 'usage: spm build [options] module',

  DESCRIPTION: 'build a module',

  REMOVED: '  Removed: %s',

  NO_SUCH: '  No such file or directory: ',

  BUILDING: '  Building %s',

  COMPRESSED: '  Compressed to %s'
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
  exists(options.config);
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
  var options = this.options;

  var outputFile = getOutputPath(inputFile, options);

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
          'excludes': options.excludes,
          'compiler_options': options.compiler_options
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
          'root_url': options.app_url,
          'compiler_options': options.compiler_options
        }
    );
    console.log(MESSAGE.COMPRESSED, outputFile);
  }
};


function exists(filepath) {
  if (filepath && !path.existsSync(filepath)) {
    throw MESSAGE.NO_SUCH + filepath;
  }
}


function isJSFile(filepath) {
  return path.extname(filepath) === '.js';
}


function getOutputPath(inputFile, options) {
  var dir = path.dirname(inputFile);
  var root = options.app_path || dir;

  var pathname = path.relative(root, inputFile);
  var to = options.out_path || path.join(dir, CONFIG.BUILD_DIR);

  var outputPath = path.join(to, pathname);
  fsExt.mkdirS(path.dirname(outputPath));
  return outputPath;
}


module.exports = Build;
