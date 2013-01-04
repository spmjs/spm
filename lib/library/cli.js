var os = require('os');
var path = require('path');
var _ = require('underscore');


function getConfig(file) {
  file = file || 'package.json';
  var isroot = false;
  if (os.type() === 'Windows_NT') {
    isroot = file.slice(1, 3) === ':\\';
  } else {
    isroot = file.charAt(0) === '/';
  }
  if (isroot) {
    return require(file);
  }
  return require(path.join(process.cwd(), file));
}
exports.getConfig = getConfig;


function mergeConfig(config, commander) {
  // module information
  var module = {
    'moduleRoot': 'root',
    'moduleName': 'name',
    'moduleVersion': 'version',
    'moduleFormat': 'format'
  };
  var data;
  _.each(module, function(value, key) {
    data = commander[key];
    if (data) {
      config[value] = data;
    }
  });

  var defaults = {
    'inputDirectory': 'src',
    'outputDirectory': 'dist'
  };
  _.each(defaults, function(value, key) {
    config[key] = commander[key] || value;
  });
  config.files = commander.files || [];
  return config;
}
exports.mergeConfig = mergeConfig;
