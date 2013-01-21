/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * ~/.spm/plugins.json
 */

var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var async = require('async');
var color = require('colorful').color;
var pluginsPath = path.join(process.env.HOME, '.spm', 'plugins.json');
var pathlib = require('./utils/pathlib');
var logging = require('colorful').logging;


exports.install = function(options) {
  // options:
  // {
  //    "name": "init",
  //    "binary": "spm-init",
  //    "description": "create template ..."
  // }
  if (!options.name) {
    throw new Error('name is missing.');
  }

  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== options.name;
  });

  rv.push({
    name: options.name,
    binary: options.binary,
    description: options.description
  });

  fs.writeJSONFileSync(pluginsPath, rv);
};

exports.uninstall = function(name) {
  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== name;
  });

  fs.writeJSONFileSync(pluginsPath, rv);
};

exports.list = function() {
  var plugins = getPlugins();
  var text;
  plugins.forEach(function(obj) {
    console.log();
    console.log(color.bold(obj.name));
    if (obj.binary) {
      console.log('  ', '(' + color.magenta(obj.binary) + ')');
    }
    console.log('    ', color.gray(obj.description || ''));
    console.log();
  });
};

function getPlugins() {
  if (!fs.existsSync(pluginsPath)) return [];
  return fs.readJSONFileSync(pluginsPath);
}
