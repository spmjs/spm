var fs = require('fs');
var path = require('path');
var pkg = require(path.join(process.cwd(), 'package.json'));
var SEA_MODULES = exports.SEA_MODULES = 'sea-modules';

// load all css files in dependencies
exports.cssDependencies = function() {
  var deps = mergeDeps();
  var ret = {};
  for (var d in deps) {
    var item = deps[d];
    item = findEntryPoint(item);
    if (/\.css$/.test(item)) {
      ret[d] = item;
    }
  }
  return ret;

  function mergeDeps(deps, pkg) {
    deps = deps || {};
    var newDeps = getDependencies(pkg);
    for (var d in newDeps) {
      deps[d] = deps[d] || newDeps[d];
      deps = mergeDeps(deps, path.join(process.cwd(), newDeps[d], 'package.json'));
    }
    return deps;
  }
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
