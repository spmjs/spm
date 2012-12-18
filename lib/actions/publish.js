var async = require('async');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Upload = require('./upload.js');
var ActionFactory = require('../core/action_factory.js');
var PluginConfig = require('../core/plugin_config.js');
var ProjectFactory = require('../core/project_factory.js');
var Opts = require('../utils/opts');
var uploadPlugin;

var Publish = ActionFactory.create('publish', 'build');

Publish.prototype.registerArgs = function() {
  Publish.super_.prototype.registerArgs.call(this);
  var opts = this.opts;
  opts.help('publish a module to sources.');
  opts.add('stable', 'publish a module!');
  opts.type('stable', 'boolean');
  opts.defaultValue('stable', true);

  opts.add('force', 'forced update module!');
  opts.type('force', 'boolean');
  opts.defaultValue('force', false);

  opts.extend(Opts.get('upload'));
};

Publish.prototype.execute = function(opts, callback) {
  Upload.super_.prototype.execute.apply(this, arguments);
};

module.exports = Publish;

