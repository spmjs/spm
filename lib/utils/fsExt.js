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
