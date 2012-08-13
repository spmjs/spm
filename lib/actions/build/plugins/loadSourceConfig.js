var fs = require('fs');
var path = require('path');
var request = require('request');
var fsExt = require('../../../utils/fs_ext.js');
var help = require('../../../utils/moduleHelp.js');
var Plugin = require('../core/plugin.js');

var loadConfig = module.exports = Plugin.create('loadSourceConfig');

loadConfig.run = function(callback) {
  var project = this.project;
  var source = project.getSource();
  var errMsg = 'merge source config error!';
  var configPath;
  var config;

  if (help.isLocalPath(source)) {
    configPath = path.join(source, 'config.json')
    if (fsExt.existsSync(configPath)) {
      config = eval('(' + fs.readFileSync(configPath) + ')');
      mergeConfig(project, config);
    } else {
      console.warn(errMsg);  
    }
    callback();
  } else {
    configPath = source + '/' + 'config.json'; 
    var opts = {
      url: configPath,
      timeout: 3000
    };
    request(opts, function(err, res, body) {
      if (!err && (res.statusCode < 400)) {
        config = eval('(' + body + ')');
        mergeConfig(project, config);
      } else {
        console.warn(errMsg);
      }
      callback();
    });
  }
};

function mergeConfig(project, config) {
  console.log('merge source config:', config);
  Object.keys(config).forEach(function(opt) {
    if (!project.hasOwnProperty(opt)) {
      project[opt] = config[opt];
    }
  }); 
}


