/**
 * for node.exe in Windows OS
 * @author lifesinger@gmail.com (Frank Wang)
 */

var isWindows = process.platform === 'win32';
var home = exports.home = isWindows ? process.env.USERPROFILE : process.env.HOME;

exports.normalizePath = function(filepath) {
  return filepath.replace(/\\/g, '/');
};

