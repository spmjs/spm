'use strict';

var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var async = require('async');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var stylusPlugin = module.exports = Plugin.create('stylus');

stylusPlugin.run = function(project, callback) {
  var build = project.buildDirectory;

  var hasStylusMod = false;
  async.forEach(fsExt.list(build, /\.styl$/), function(moduleName, callback) {
    toCSS(build, moduleName, function(err, css) {
      if (err) {
        callback(err);
        return;
      }

      hasStylusMod = true;
      //fs.unlinkSync(path.join(build, moduleName));
      moduleName = moduleName.replace(/styl$/, 'styl.css');
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
    .include(dir)
    .render(function(err, css){
       callback(err, css);
    });
}

// 如果进行less 编译，对output进行检查更新.
var stylusTypeReg = /\.styl$/;
function filterOutput(output) {
  Object.keys(output).forEach(function(itemName) {
    var value = output[itemName];
   
    if (stylusTypeReg.test(itemName)) {
      delete output[itemName];
      itemName = getStylusCss(itemName);
    }

    if (value === 'default' || value === '.' || value === '*') {
      return;
    }

    if (_.isString(value)) {
      value = [value];
    }

    value.forEach(function(subItem, index) {
      if (stylusTypeReg.test(subItem)) {
        value.splice(index, 1, getStylusCss(subItem));
      }
    });

    output[itemName] = value;
  });
}

function getStylusCss(name) {
  return name.replace(stylusTypeReg, 'styl.css');
}
