var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var fsExt = require('../utils/fs_ext.js');
var help = require('../utils/moduleHelp.js');
var Plugin = require('../core/plugin.js');

var loadConfig = module.exports = Plugin.create('loadSourceConfig');

var errMsg = 'merge source config error!';

loadConfig.run = function(callback) {
  var project = this.project;
  var source = project.getSource();
  var configPath;
  var config;

  if (help.isLocalPath(source)) {
    configPath = path.join(source, 'config.json');
    if (fsExt.existsSync(configPath)) {
      config = eval('(' + fs.readFileSync(configPath) + ')');
      mergeConfig(project, config);
    } else {
      console.log(errMsg);
    }
    callback();
  } else {
    var sourceUrls = [source];
    if (project.root && project.root !== '#') {
      sourceUrls.unshift(source + '/' + root);
    }
    async.forEachSeries(sourceUrls, function(sourceUrl, callback) {
      mergeSourceConfig(sourceUrl, callback);
    }, function(err) {
      callback();
    });
  }
};

function mergeSourceConfig(sourceUrl, callback) {
  var project = loadConfig.project;
  var configUrl = sourceUrl + '/' + 'config.json';
  var opts = {
    url: configUrl,
    timeout: 3000
  };
  request(opts, function(err, res, body) {
    if (!err && (res.statusCode < 400)) {
      config = eval('(' + body + ')');
      project.modConfig.addConfig(config, sourceUrl);
    } else {
      console.log(errMsg);
    }
    callback();
  });
}


