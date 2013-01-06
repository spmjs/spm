var async = require('async');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Upload = require('./upload.js');
var ActionFactory = require('../core/action_factory.js');
var PluginConfig = require('../core/plugin_config.js');
var ProjectFactory = require('../core/project_factory.js');
var uploadPlugin;

var Publish = ActionFactory.create('publish', 'build');

Publish.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('publish a module to sources.');
  opts.option('--stable [flag]', 'publish a module!', true);
  opts.option('--force [flag]', 'forced update module!', false);
};

Publish.prototype.execute = function(opts, callback) {
  Upload.super_.prototype.execute.apply(this, arguments);
};

module.exports = Publish;

