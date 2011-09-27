/**
 * @fileoverview Extensions for filesystem utilities.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');


/**
 * rm -rf dir.
 * @param {string} dir The directory path.
 */
exports.rmdirRF = function(dir) {

  fs.readdirSync(dir).forEach(function(name) {
    var item = path.join(dir, name);

    if (fs.statSync(item).isFile()) {
      fs.unlinkSync(item);
    }
    else {
      exports.rmdirRF(item);
    }
  });

  fs.rmdirSync(dir);
};


/**
 * mkdir -s dir.
 * @param {string} dir The directory path.
 */
exports.mkdirS = function(dir) {
  if (!path.existsSync(dir)) {
    fs.mkdirSync(dir, '0766');
  }
};


/**
 * Whether the filepath is an absolute path.
 * @param {string} filepath The file path.
 * @return {boolean} The boolean result.
 */
exports.isAbsolutePath = function(filepath) {
  return filepath.charAt(0) === '/' ||
      filepath.indexOf('://') !== -1 ||
      filepath.indexOf(':\\') !== -1;
};


/**
 * Whether the filepath is a relative path.
 * @param {string} filepath The module id.
 * @return {boolean} The boolean result.
 */
exports.isRelativePath = function(filepath) {
  return filepath.indexOf('./') === 0 ||
      filepath.indexOf('../') === 0;
};


/**
 * Whether the filepath is a top-level path.
 * @param {string} filepath The file path.
 * @return {boolean} The boolean result.
 * @this exports
 */
exports.isTopLevelPath = function(filepath) {
  return !exports.isAbsolutePath(filepath) &&
      !exports.isRelativePath(filepath);
};
