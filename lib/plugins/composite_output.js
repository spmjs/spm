// 比较负责的output规则和后续对output额外解析规则都由这个插件来处理.
var path = require('path');
var async = require('async');

var Plugin = require('../core/plugin.js');
var moduleHelp = require('../utils/module_help.js');
var fsExt = require('../utils/fs_ext.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;

var compositePlugin = module.exports = Plugin.create('composite_output');

compositePlugin.run = function(project, callback) {
  var handlersDir = path.join(path.dirname(module.filename), 'output_extra');

  var outputHandlers = fsExt.listFiles(handlersDir).map(function(mod) {
    return require(mod);
  });

  async.forEachSeries(outputHandlers, function(handler, cb) {
    handler.run(project, cb);
  }, function() {
    callback();
  });
};

