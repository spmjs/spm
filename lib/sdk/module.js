var util = require('util');
var log = require('../utils/log');
var file = require('./file');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

function parseDependencies(deps) {
  return Object.keys(deps).map(function(key) {
    return key + '@' + deps[key];
  });
}
exports.parseDependencies = parseDependencies;

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
    var req = requires(fs.readFileSync(path.join(process.cwd(), main)).toString()).map(function(item) {
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
};
