'use strict';

var async = require('async');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');
var Build = require('./build.js');
var ActionFactory = require('../core/action_factory.js');
var PluginConfig = require('../core/plugin_config.js');
var ProjectFactory = require('../core/project_factory.js');
var uploadPlugin;

var Upload = ActionFactory.create('upload', 'build');

Upload.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('上传模块到源服务中');
  opts.option('--extra-resources [str]', '是否上传额外的资源文件，比如 src, test, 默认为不上传 [src,test,docs]', '');
};

Upload.prototype.execute = function(opts, callback) {
  if (opts.extras && opts.extras.length > 0) {
    console.info('Begin upload tar......');

    uploadPlugin = PluginConfig.getPlugin('upload');
    var baseDir = process.cwd();
    var queue = async.queue(function(modBasePath, callback) {
      uploadMod(modBasePath, callback);
    }, 1);

    queue.drain = function() {
      console.info('UPLOAD SUCCESS!');
      callback();
    };

    var mods = opts.extras;
    mods.forEach(function(mod) {
      if (/\.tgz$/.test(mod)) {
        queue.push(path.join(baseDir, path.dirname(mod)));
      } else {
        var modTars = fsExt.listFiles(path.join(baseDir, mod), /\.tgz$/);
        modTars.forEach(function(modTar) {
          queue.push(path.dirname(modTar));
        });
      }
    });
  } else {
    Upload.super_.prototype.execute.apply(this, arguments);
  }
};

var CONFIG = 'package.json';
function uploadMod(modPath, cb) {
  var configPath = path.join(modPath, CONFIG);
  if (!fsExt.existsSync(configPath)) {
    console.warn(modPath + '  not found package.json!');
    cb();
    return;
  }

  var _options = Upload.prototype.createOptions({base: modPath});
  ProjectFactory.getProjectModel('upload', _options, function(model) {
    var source = model.getSource();
    var root = model.root;
    var name = model.name;
    var version = model.version;
    var tarPath = path.join(modPath, name + '.tgz');

    if (root && root !== '#') {
      source = source + '/' + root;
      root = root + '/';
    } else {
      root = '';
    }

    uploadPlugin.uploadTarToServer(model, tarPath, source, function() {
      console.info('upload ' + root + name + '/' + version + '/' + name + ' success!');
      cb();
    });
  });
}
module.exports = Upload;
