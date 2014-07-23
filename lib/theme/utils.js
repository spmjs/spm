var fs = require('fs');
var path = require('path');
var SEA_MODULES = exports.SEA_MODULES = 'sea-modules';

// load all css files in dependencies
exports.cssDependencies = function() {
  var ret = {};
  var packages = [];
  try {
    packages = fs.readdirSync(SEA_MODULES);
  } catch(e) {}
  packages.forEach(function(p) {
    var filepath = path.join(SEA_MODULES, p);
    if (!isDirectory(filepath)) return;
    var versions = fs.readdirSync(filepath);
    versions.forEach(function(v) {
      if (!isDirectory(path.join(filepath, v))) return;
      var tempPkg = JSON.parse(fs.readFileSync(path.join(SEA_MODULES, p, v, 'package.json')));
      tempPkg.spm = tempPkg.spm || {};
      var main = tempPkg.spm.main || '';
      if (tempPkg.spm && /\.css$/.test(main)) {
        ret[tempPkg.name] = 'sea-modules/' + tempPkg.name + '/' + tempPkg.version + '/' + main;
      }
    });
  });
  return ret;
};

exports.getDependencies = function() {
  var ret = {};
  var packages = [];

  try {
    packages = fs.readdirSync(SEA_MODULES);
  } catch(e) {}

  packages.forEach(function(p) {
    var filepath = path.join(SEA_MODULES, p);
    if (!isDirectory(filepath)) return;
    var versionDirs = fs.readdirSync(filepath);
    versionDirs = versionDirs.filter(function(version) {
      return isDirectory(path.join(filepath, version));
    });
    var latestVersion = versionDirs.sort(function(a, b) {
      a = a.split('.');
      b = b.split('.');
      for (var i=0; i<a.length; i++) {
        if (parseInt(a[i]) !== parseInt(b[i])) {
          return parseInt(b[i]) - parseInt(a[i]);
        } else {
          continue;
        }
      }
    })[0];
    ret[p] = SEA_MODULES + '/' + p + '/' + latestVersion;
  });

  return ret;
};

exports.findEntryPoint = function(filePath) {
  var pkgFile = path.join(process.cwd(), filePath + '/package.json');
  try {
    var pkg = JSON.parse(fs.readFileSync(pkgFile));
  } catch(e) {}
  if (pkg && pkg.spm && pkg.spm.main) {
    return filePath + '/' +  pkg.spm.main;
  }
  return filePath + '/index.js';
};

function isDirectory(filepath) {
  return fs.lstatSync(filepath).isDirectory();
}
