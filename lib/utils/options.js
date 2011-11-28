/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');
var WinOS = require('./win_os.js');


var Options = module.exports = {};


Options.mergeFromConfigFile = function(configFile, options, AVAILABLE_OPTIONS) {
  var config = require(configFile);

  for (var o in config) {
    var meta = AVAILABLE_OPTIONS[o];
    if (config.hasOwnProperty(o) && !(o in options) && meta) {
      var val = config[o];
      options[o] = meta.ispath ? normalizePath(val, configFile) : val;
    }
  }
};


Options.normalize = function(options, AVAILABLE_OPTIONS) {
  for (var o in options) {
    var meta = AVAILABLE_OPTIONS[o];
    if (options.hasOwnProperty(o) && meta && meta.ispath) {
      options[o] = normalizePath(options[o]);
    }
  }
};


function normalizePath(val, configFile) {
  var result = val;

  if (configFile) {
    result = path.resolve(path.dirname(configFile), val);
  }
  else {
    result = path.resolve(val);
  }

  return WinOS.normalizePath(result);
}
