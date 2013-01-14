'use strict';

var path = require('path');
var async = require('async');

var spm = require('../spm.js');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

var plugin = module.exports = Plugin.create('build_all');

var ACTION = 'build';

plugin.run = function(project, callback) {
  var modules = project.modules || [];
  var base = project.baseDirectory;
  var action = project.action;

  async.forEachSeries(modules, function(mod, cb) {
    var subBase = path.join(base, mod); 
    if (fsExt.existsSync(subBase)) {
      spm.getAction(action).run({
        base: subBase
      }, function() {
        cb();
      });
    } else {
      console.warn('配置的子模块有误: ' + mod);
      cb();
    }
  }, function() {
    callback();
  });
};

