/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * ~/.spm/plugins.json
 */

var path = require('path');
var color = require('colorful');
var grunt = require('./sdk/grunt');

var pluginsPath = path.join(process.env.HOME, '.spm', 'plugins.json');


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

  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== options.name;
  });

  rv.push({
    name: options.name,
    binary: options.binary,
    description: options.description
  });

  grunt.file.writeJSON(pluginsPath, rv);
};

exports.uninstall = function(name) {
  var plugins = getPlugins();
  var rv = plugins.filter(function(obj) {
    return obj.name !== name;
  });

  grunt.file.writeJSON(pluginsPath, rv);
};

exports.list = function() {
  var plugins = getPlugins();
  plugins.forEach(function(obj) {
    console.log();
    console.log('  ' + color.cyan(obj.name));
    if (obj.binary) {
      console.log('  binary:', color.magenta(obj.binary));
    }
    console.log('  desc:', color.gray(obj.description || ''));
    console.log();
  });
};

function getPlugins() {
  if (!grunt.file.exists(pluginsPath)) return [];
  return grunt.file.readJSON(pluginsPath);
}
exports.plugins = getPlugins;
