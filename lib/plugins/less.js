'use strict';

var path = require('path');
var less = require('less');
var async = require('async');
var _ = require('underscore');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var lessTypeReg = /\.less$/;
var lessPlugin = module.exports = Plugin.create('less');

lessPlugin.run = function(project, callback) {
  var build = project.buildDirectory;

  async.forEach(fsExt.list(build, lessTypeReg), function(moduleName, callback) {
    toCSS(build, moduleName, function(err, cssCode) {
      if (err) {
        callback(err);
        return;
      }

      moduleName = getCssName(moduleName);
      fsExt.writeFileSync(path.join(build, moduleName), cssCode);
      callback();
    });
  }, function(err) {
    if (err) {
      console.error(err);
      throw new Error(err.message);
    }

    callback();
  });
};

function toCSS(dir, moduleName, callback) {
  var tree, css;
  var code = fsExt.readFileSync(path.join(dir, moduleName));
  var parser = new less.Parser({
    paths: [dir],
    optimization: 0,
    filename: moduleName
  });

  parser.parse(code, function(err, tree) {
    if (err) {
       callback(err);
    } else {
      try {
        css = tree.toCSS();
        callback(null, css);
      } catch (e) {
         callback(e);
      }
    }
  });
}

function isLess(name) {
  return lessTypeReg.test(filepath);
}

function getCssName(lessName) {
  return lessName.replace(lessTypeReg, '.css');
}
