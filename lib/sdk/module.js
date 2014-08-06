var file = require('./file');
var path = require('path');
var fs = require('fs');
var searequire = require('searequire');
var Package = require('umi').Package;

function parseDependencies(deps) {
  return Object.keys(deps).map(function(key) {
    return key + '@' + deps[key];
  });
}
exports.parseDependencies = parseDependencies;

exports.getSourceFiles = function(root) {
  var pkg = new Package(root || process.cwd());
  return Object.keys(pkg.files).map(function(file) {
    return file.replace(/\.js$/, '');
  });
};
