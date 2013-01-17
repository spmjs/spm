var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var logging = require('colorful').logging;
var _ = require('underscore');

/* binding.spm
 *
 * {
 *   "dependencies": {
 *     "class": "arale/class/1.0.0/class"
 *   },
 *   "output": {
 *     "golang": "."
 *   }
 * }
 *
 */

function getConfig(file) {
  file = file || 'binding.spm';
  var isroot = false, config;
  if (os.type() === 'Windows_NT') {
    isroot = file.slice(1, 3) === ':\\';
  } else {
    isroot = file.charAt(0) === '/';
  }
  if (!isroot) {
    file = path.join(process.cwd(), file);
  }
  config = fs.readJSONFileSync(file);
  config.configFile = file;

  var cpath = path.dirname(file);
  config.buildDirectory = config.buildDirectory || path.join(cpath, '.spm-build');

  var pfile = path.join(cpath, 'package.json');
  if (fs.existsSync(pfile)) {
    _.defaults(config, fs.readJSONFileSync(pfile));
  } else {
    logging.warn('missing package.json');
  }
  return config;
}
exports.getConfig = getConfig;


function mergeConfig(config, options) {
  // module information
  var module = {
    'moduleRoot': 'root',
    'moduleName': 'name',
    'moduleVersion': 'version',
    'moduleFormat': 'format'
  };
  var data;
  _.each(module, function(value, key) {
    data = options[key];
    if (data) {
      config[value] = data;
    }
  });

  var defaults = {
    'inputDirectory': 'src',
    'outputDirectory': 'dist'
  };
  _.each(defaults, function(value, key) {
    config[key] = options[key] || value;
  });
  return config;
}
exports.mergeConfig = mergeConfig;
