var fs = require('fs');
var path = require('path');
var pkg = require(path.join(process.cwd(), 'package.json'));
var SEA_MODULES = exports.SEA_MODULES = 'sea-modules';

// load all css files in dependencies
exports.cssDependencies = function() {
  var ret = {};
  var modulesPath = path.join(process.cwd(), 'sea-modules');
  var packages = fs.readdirSync(modulesPath);
  packages.forEach(function(p) {
    var versions = fs.readdirSync(path.join(modulesPath, p));
    versions.forEach(function(v) {
      var tempPkg = JSON.parse(fs.readFileSync(path.join(modulesPath, p, v, 'package.json')));
      tempPkg.spm = tempPkg.spm || {};
      var main = tempPkg.spm.main || '';
      if (tempPkg.spm && /\.css$/.test(main)) {
        ret[tempPkg.name] = 'sea-modules/' + tempPkg.name + '/' + tempPkg.version + '/' + main;
      }
    });
  });
  return ret;
};

var getDependencies = exports.getDependencies = function(pkg) {
  pkg = pkg || 'package.json';
  if (typeof pkg === 'string') {
    try {
      pkg = JSON.parse(fs.readFileSync(pkg));
    } catch(e) {}
  }
  var ret = {};
  if (pkg.spm) {
    var dependencies = pkg.spm.dependencies || {};
    var devDependencies = pkg.spm.devDependencies || {};
    Object.keys(dependencies).forEach(function(key) {
      ret[key] = SEA_MODULES + '/' + key + '/' + dependencies[key];
    });
    Object.keys(devDependencies).forEach(function(key) {
      ret[key] = SEA_MODULES + '/' + key + '/' + devDependencies[key];
    });
  }
  return ret;
};

var findEntryPoint = exports.findEntryPoint = function(filePath) {
  var pkgFile = path.join(process.cwd(), filePath + '/package.json');
  try {
    var pkg = JSON.parse(fs.readFileSync(pkgFile));
  } catch(e) {}
  if (pkg && pkg.spm && pkg.spm.main) {
    return filePath + '/' +  pkg.spm.main;
  }
  return filePath + '/index.js';
};

/**
 * Parse requires in `str`.
 *
 * @param {String} str
 * @param {Function} [fn]
 * @return {Array}
 * @api public
 */

exports.requires = function(str, fn) {
  if (fn) return map(str, fn);
  var re = /require *\(['"]([^'"]+)['"]\)/g;
  var ret = [];
  var m;

  while (m = re.exec(str)) {
    ret.push({
      string: m[0],
      path: m[1],
      index: m.index
    });
  }
  return ret;
};

function map(str, fn) {
  requires(str).forEach(function(r){
    str = str.replace(r.string, fn(r));
  });

  return str;
}
