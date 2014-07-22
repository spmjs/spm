var file = require('./file');
var path = require('path');
var fs = require('fs');
var searequire = require('searequire');

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
  var ret = lookupFiles(main).filter(function(item) {
    var file = existFile(item);
    if (file) {
      return file;
    }
  });
  return ret.concat(main.replace(/\.js$/, ''));

  function lookupFiles(main) {
    main = existFile(main);

    var code = searequire(fs.readFileSync(path.join(process.cwd(), main)).toString());
    var req = code.map(function(item) {
      return item.path.replace(/\.js$/, '');
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

function existFile(file) {
  if (fs.existsSync(file) &&
      fs.lstatSync(file).isFile()) {
    return file;
  }
  if (path.extname(file) !== '.js'
      && fs.existsSync(file + '.js')) {
    return file + '.js';
  }
  if (fs.existsSync(file) &&
      fs.lstatSync(file).isDirectory()
      && fs.existsSync(file + '/index.js')) {
    return file + '/index.js';
  }
}
