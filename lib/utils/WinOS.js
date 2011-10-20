/**
 * for node.exe in Windows OS
 * @author lifesinger@gmail.com (Frank Wang)
 */


exports.normalizePath = function(filepath) {
  return filepath.replace(/\\/g, '/');
};
