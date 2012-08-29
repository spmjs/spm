
var fs = require('fs');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Options = require('../utils/options.js');
var Compressor = require('../utils/compressor.js');
var Combo = require('../utils/combo.js');
var ActionFactory = require('../core/action_factory.js');
var LoaderConfig = require('../utils/loader_config.js');


var Build = ActionFactory.create('Build');

Build.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('BUILD MODULE \nusage: spm build_old [options] module');
  opts.add('clear', 'clear all built files');
  opts.add('combine', 'combine dependences to one file');
  opts.add('combine_all', 'combine dependences including base modules to one file');
  opts.add('-app_url', 'specify the root URL of app modules');
  opts.add('app_path', 'specify the root directory of app modules');
  opts.add('base_path', 'specify the root directory of base modules');
  opts.add('out_path', 'specify the root directory of built modules');
  opts.add('config', 'specify the path of the loader config file');
  opts.add('loader_config', 'specify the path of the loader config file');
  opts.add('r', 'recursive', 'recursively build all files in directories and subdirectories');
  opts.add('excludes', 'exclude those modules whose paths match this regexp');
  opts.add('compiler_options', 'the options passed to the internal compiler');
};

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

  REMOVED: '  Removed: %s',

  NO_SUCH: '  No such file or directory: ',

  BUILDING: '  Building %s',

  COMPRESSED: '  Compressed to %s'
};

var CONFIG = Build.CONFIG;
var MESSAGE = Build.MESSAGE;

Build.prototype.run = function() {
  var that = this;
  var argv = this.opts.argv;
  var modules = this.modules = this.opts.argv._.slice(3);
  var options = this.options;

  // spm build --clear
  if (argv.clear) {
    this.clear();
    return;
  }

  // spm build
  if (modules.length === 0) {
    console.info(this.opts.help()); 
    return;
  }

  // prepare options
  exists(argv.config);
  var configFile = path.resolve(argv.config || CONFIG.BUILD_CONFIG_FILE);
  if (fsExt.existsSync(configFile)) {
    Options.mergeFromConfigFile(configFile, argv, Build.AVAILABLE_OPTIONS);
  }
  Options.normalize(argv, Build.AVAILABLE_OPTIONS);

  // spm build modules
  var firstRun = true;
  build(modules, process.cwd());

  function build(items, root) {
    items.forEach(function(item) {
      var filepath = path.resolve(root, item);
      var stat = fs.statSync(filepath);
      // spm build a.js
      if (stat.isFile() && isJSFile(filepath)) {
        that.build(filepath);
      }
      // spm build folder
      else if (stat.isDirectory() &&
          (firstRun || argv.recursive) &&
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
      console.info(MESSAGE.REMOVED, p);
    }
    else {
      if (fs.statSync(p).isDirectory()) {
        Build.prototype.clear(p);
      }
    }
  });

};


Build.prototype.build = function(inputFile) {
  console.info(MESSAGE.BUILDING, inputFile);
  var options = this.opts.argv;

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
    console.info(MESSAGE.COMPRESSED, outputFile);
  }
};


function exists(filepath) {
  if (filepath && !fs.existsSync(filepath)) {
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

