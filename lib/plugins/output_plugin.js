'use strict';

var path = require('path');
var async = require('async');
var _ = require('underscore');

var resourcesRule = require('./output/resourcesRule.js')

var Plugin = require('../core/plugin.js');
var moduleHelp = require('../utils/module_help.js');
var fsExt = require('../utils/fs_ext.js');

var plugin = module.exports = Plugin.create('output_plugin');

// 项目文件合并输出.
plugin.run = function(project, callback) {
  this.project = project;
  this.writeModule();
  callback();
};

plugin.writeModule = function() {
  var project = this.project;
  var output = project.output;

  if (_.isEmpty(output)) {
    this.createDefaultOutput(project);
  }

  _.keys(output).forEach(function(key) {
    var mods = output[key];

    if (mods === '.' || mods === '*') {
      mods = key;
    }

    if (!_.isArray(mods)) {
      mods = [mods];
    }

    var codes = [];

    mods.forEach(function(mod) {
      codes.push(project.getModuleCode(mod));
    });

    var codes = codes.join('\n\n');

    var moduleFile = path.join(project.distDirectory, key);
    fsExt.writeFileSync(moduleFile, codes);
  });
};

plugin.createDefaultOutput = function() {
  var output = {};
  output[project.name + '.js'] = '.';
  this.project = output;
};
