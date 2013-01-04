var fs = require('fs');
var path = require('path');

function walkdirSync(baseDir, filterFn) {
  var files = [];
  var currentFiles, nextDirs;

  currentFiles = fs.readdirSync(baseDir);
  nextDirs = currentFiles.filter(function(fname) {
    if (filterFn && !filterFn(fname)) return false;
    return fs.statSync(path.join(baseDir, fname)).isDirectory();
  });

  currentFiles.forEach(function(fname) {
    if (filterFn && !filterFn(fname)) return;

    var abspath = path.join(baseDir, fname);
    if (fs.statSync(abspath).isFile()) {
      files.push(abspath);
    }
  });

  while (nextDirs.length) {
    files = files.concat(
      walkdirSync(path.join(baseDir, nextDirs.shift()), filterFn)
    );
  }

  return files;
}
exports.walkdirSync = walkdirSync;
