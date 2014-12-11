var spmrc = require('spmrc');
var Package = require('father').SpmPackage;

exports.getSourceFiles = function(root) {
  var pkg = new Package(root || process.cwd(), {
    moduleDir: spmrc.get('install.path')
  });
  return Object.keys(pkg.files).map(function(file) {
    return file.replace(/\.js$/, '');
  });
};
