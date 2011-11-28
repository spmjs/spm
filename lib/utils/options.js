/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');


var Options = module.exports = {};


Options.TYPES = {
  BOOL: 1,
  PATH: 2,
  REGEXP: 4,
  URL: 8
};



Options.mergeFromConfigFile = function(configFile, options, AVAILABLE_OPTIONS) {
  var config = require(configFile);

  for (var o in config) {
    if (config.hasOwnProperty(o) && !(o in options)) {
      var meta = AVAILABLE_OPTIONS[o];
      if (meta) {
        options[o] = normalize(config[o], meta.type, configFile);
      }
    }
  }
};


Options.normalize = function(options, AVAILABLE_OPTIONS) {
  for (var o in options) {
    var meta = AVAILABLE_OPTIONS[o];
    if (options.hasOwnProperty(o) && meta) {
      options[o] = normalize(options[o], meta.type);
    }
  }
};


function normalize(val, type, configFile) {
  var result = val;

  if (type === Options.TYPES.REGEXP) {
    result = new RegExp(val);
  }
  else if (type === Options.TYPES.PATH) {
    if (configFile) {
      result = path.resolve(path.dirname(configFile), val);
    }
    else {
      result = path.resolve(val);
    }

    // make sure that the path exists.
    if (!path.existsSync(result)) {
      throw '\nNo such file or directory: ' + path;
    }
  }

  return result;
}
