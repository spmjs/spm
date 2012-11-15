var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var fsExt = require('../utils/fs_ext.js');
var help = require('../utils/module_help.js');
var Plugin = require('../core/plugin.js');

var opts = require('../utils/opts').get();
var argv = opts.argv;

var loadConfig = module.exports = Plugin.create('loadSourceConfig');

var errMsg = 'merge source config error!';

loadConfig.run = function(project, callback) {
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
    var root = project.root;
    if (root && root !== '#') {
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
  var opt = {
    url: configUrl,
    timeout: argv.timeout 
  };

  console.info('Downloading: ' + opt.url);
  request(opt, function(err, res, body) {

    console.info('Downloaded: ' + opt.url);
    if (!err && (res.statusCode < 400)) {
      config = eval('(' + body + ')');
      project.modConfig.addConfig(config, sourceUrl);
    } else {
      console.log(errMsg);
    }
    callback();
  });
}


