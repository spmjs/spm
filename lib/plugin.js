/*
 * Plugin System
 * @author: Hsiaoming Yang <me@lepture.com>
 *
 * ~/.spm/plugins.json
 */

var path = require('path');
var color = require('colorful');
var spmrc = require('spmrc');
var file = require('./sdk/file');

var homedir = spmrc.get('user.home');
var pluginsPath = path.join(homedir, '.spm', 'plugins.json');


exports.install = function(options) {
  // options:
  // {
  //    "name": "init",
  //    "bin": "spm-init",
  //    "description": "create template ..."
  // }
  if (!options.name) {
    throw new Error('name is missing.');
  }
  options.binary = options.binary || options.bin;

  if (!options.binary) {
    throw new Error('bin is missing.');
  }

  // support for shortname desc
  options.description = options.description || options.desc;

  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== options.name;
  });

  rv.push({
    name: options.name,
    binary: options.binary,
    description: options.description
  });

  file.writeJSON(pluginsPath, rv);
};

exports.uninstall = function(name) {
  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== name;
  });

  file.writeJSON(pluginsPath, rv);
};

exports.list = function() {
  var plugins = getPlugins();
  plugins.forEach(function(obj) {
    console.log();
    console.log('  ' + color.cyan(obj.name));
    if (obj.binary) {
      console.log('  bin:', color.magenta(obj.binary));
    }
    console.log('  desc:', color.gray(obj.description || ''));
  });
};

function getPlugins() {
  if (!file.exists(pluginsPath)) return [];
  return file.readJSON(pluginsPath);
}
exports.plugins = getPlugins;
