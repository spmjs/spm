'use strict';

var path = require('path');
var stylus = require('stylus');
var async = require('async');
var _ = require('underscore');
var nib = require('nib');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var stylusTypeReg = /\.styl$/;
var stylusPlugin = module.exports = Plugin.create('stylus');

stylusPlugin.run = function(project, callback) {
  var build = project.buildDirectory;

  async.forEach(fsExt.list(build, stylusTypeReg), function(moduleName, callback) {
    toCSS(build, moduleName, function(err, css) {
      if (err) {
        callback(err);
        return;
      }

      moduleName = getStylusCss(moduleName);
      fsExt.writeFileSync(path.join(build, moduleName), css);
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
  var modPath = path.join(dir, moduleName);
  var code = fsExt.readFileSync(modPath);

  stylus(code)
    .set('filename', modPath)
    .use(nib())
    .include(dir)
    .render(function(err, css){
       callback(err, css);
    });
}

function getStylusCss(name) {
  return name.replace(stylusTypeReg, '.css');
}
