/* module */

var util = require('util');
var cmd = require('cmd-util');
var log = require('../utils/log');
var file = require('./file');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');


exports.srcDependencies = function(src, pkg) {
  src = src || 'src';
  pkg = pkg || 'package.json';
  if (typeof pkg === 'string') {
    pkg = file.readJSON(pkg);
  }
  var code, parsed, deps = [];
  file.recurse(src, function(fpath) {
    if (/\.js$/.test(fpath)) {
      code = file.read(fpath);
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

function parseDependencies(deps) {
  return Object.keys(deps).map(function(key) {
    return key + '@' + deps[key];
  })
}
exports.parseDependencies = parseDependencies;


function parseIdentify(id) {
  if (!id) return {};
  var regex = /^([a-zA-Z][a-zA-Z0-9\-]*)\/(\d+\.\d+\.\d+)\/([a-zA-Z0-9\-\/\.]+)$/;
  var match = id.match(regex);
  if (!match) return null;
  var name, version, filename;
  name = match[1];
  version = match[2];
  filename = match[3];
  return {name: name, version: version, filename: filename};
}
exports.parseIdentify = parseIdentify;


exports.getSourceFiles = function(pkg) {
  pkg = pkg || 'package.json';
  if (typeof pkg === 'string') {
    pkg = file.readJSON(pkg);
  }

  var main = pkg.spm.main || 'index.js';
  var ret = lookupFiles(main).map(function(item) {
    if (fs.statSync(item + '.js')) {
      return item + '.js';
    }
  });
  return ret.concat(main);

  function lookupFiles(main) {
    path.extname(main) || (main = main + '.js');

    var requires = require('requires');
    var req = requires(fs.readFileSync(path.join(process.cwd(), main))).map(function(item) {
      return item.path.replace('.js', '');
    });
    req = req.slice().filter(function(item) {
      return item.charAt(0) === '.';
    });
    req = req.map(function(item) {
      return path.join(path.dirname(main), item);
    });
    req.forEach(function(item) {
      req = req.concat(lookupFiles(item));
    });
    return req;
  }
}

exports.getSpecFiles = function(pkg) {
  pkg = pkg || 'package.json';
  if (typeof pkg === 'string') {
    pkg = file.readJSON(pkg);
  }
  var spec = pkg.spm.tests || '**/*-spec.js';
  return require('glob').sync(spec);
}
