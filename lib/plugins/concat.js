'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var cleanCss = require('../compress/clean_css.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;
var isJs = moduleHelp.isJs;

var Plugin = require('../core/plugin.js');

var concatPlugin = module.exports = Plugin.create('concat');

// TODO 根据output的配置，进行合并.
concatPlugin.run = function(project, callback) {
  var opts = this.opts;
  var base = project.baseDirectory;
  var sourceFiles = project.getConfig('sourceFiles');
  var dest = opts.dest;

  if (!sourceFiles && !dest) {
    callback();
    return;
  }

  dest = moduleHelp.perfectLocalPath(dest);

  if (util.isArray(sourceFiles)) {
    var codeList = sourceFiles.map(function(source) {
      return fsExt.readFileSync(path.join(base, source));
    });

    var codes = codeList.join('\n\n');
    fsExt.writeFileSync(dest, codes);
  }
  callback();
};
