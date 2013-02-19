/* module */

var util = require('util');
var cmd = require('cmd-util');
var log = require('../utils/log');
var grunt = require('./grunt');
var _ = grunt.util._;


exports.srcDependencies = function(src, pkg) {
  src = src || 'src';
  pkg = pkg || 'package.json';
  if (typeof pkg === 'string') {
    pkg = grunt.file.readJSON(pkg);
  }
  var code, parsed, deps = [];
  grunt.file.recurse(src, function(fpath) {
    if (/\.js$/.test(fpath)) {
      code = grunt.file.read(fpath);
      parsed = cmd.ast.parse(code);
      parsed.forEach(function(meta) {
        meta.dependencies.forEach(function(dep) {
          if (!_.contains(deps, dep)) {
            deps.push(cmd.iduri.parseAlias(pkg, dep));
          }
        });
      });
    }
  });
  return parseDependencies(deps);
};

exports.distDependencies = function(dist) {
  dist = dist || 'dist';
  var code, parsed, deps = [];
  grunt.file.recurse(dist, function(fpath) {
    if (/\.js$/.test(fpath)) {
      code = grunt.file.read(fpath);
      parsed = cmd.ast.parse(code);
      parsed.forEach(function(meta) {
        deps = _.union(deps, meta.dependencies);
      });
    }
  });
  return parseDependencies(deps);
};

function parseDependencies(data) {
  var regex = /^((?:[a-z][a-z0-9\-]*\/)?[a-z][a-z0-9\-]*)\/(\d+\.\d+\.\d+)\/[a-z0-9\-\/]+$/;
  var deps = {};
  data.forEach(function(value) {
    var match = value.match(regex);
    if (!match) return;
    var key = match[1], version = match[2];
    if (deps.hasOwnProperty(key)) {
      if (!_.contains(deps[key], version)) {
        deps[key].push(version);
        log.warn('version', util.format('%s: %s', key, deps[key]));
      }
    } else {
      deps[key] = [version];
    }
  });
  return deps;
}
exports.parseDependencies = parseDependencies;


exports.plainDependencies = function(deps) {
  var packages = [];
  Object.keys(deps).forEach(function(key) {
    deps[key].forEach(function(v) {
      packages.push(key + '@' + v);
    });
  });
  return packages;
};
