/**
 * for node.exe in Windows OS
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');
var isWindows = process.platform === 'win32';
var home = exports.home = isWindows ? process.env.USERPROFILE : process.env.HOME;

//fix node 0.6.x bug;
if (isWindows) {
  path.sep = path.sep || '\\';
} else {
  path.sep = path.sep || '/';
}

exports.normalizePath = function(filepath) {
  return filepath.replace(/\\/g, '/');
};

