// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview Utilities for spm.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var url = require('url');

var config = require('../config.js');


/**
 * rm -rf dir.
 * @param {string} dir The directory path.
 */
exports.rmdirForce = function(dir) {

  fs.readdirSync(dir).forEach(function(name) {
    var item = path.join(dir, name);

    if (fs.statSync(item).isFile()) {
      fs.unlinkSync(item);
    }
    else {
      exports.rmdirForce(item);
    }
  });

  fs.rmdirSync(dir);
};


/**
 * Creates the dir if it does not exist.
 * @param {string} dir The directory path.
 */
exports.mkdirSilent = function(dir) {
  if (!path.existsSync(dir)) {
    fs.mkdirSync(dir, '0766');
  }
};


/**
 * Gets the relative parts of path according to basedir.
 * @param {string} filepath The file path.
 * @param {string} basedir The base directory, default is current working dir.
 * @return {string} The relative path.
 */
exports.getRelativePath = function(filepath, basedir) {
  basedir = basedir || process.cwd();

  if (filepath.indexOf(basedir) === 0) {
    filepath = filepath.replace(basedir + '/', '');
  }

  return filepath;
};


/**
 * Whether the id is absolute id.
 * @param {string} id The module id.
 * @return {boolean} The boolean result.
 */
exports.isAbsoluteId = function(id) {
  return id.indexOf('/') === 0 ||
      id.indexOf('://') !== -1 ||
      id.indexOf(':\\') !== -1;
};


/**
 * Whether the id is relative id.
 * @param {string} id The module id.
 * @return {boolean} The boolean result.
 */
exports.isRelativeId = function(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0;
};


/**
 * Whether the id is top-level id.
 * @param {string} id The module id.
 * @return {boolean} The boolean result.
 * @this exports
 */
exports.isTopLevelId = function(id) {
  return !this.isAbsoluteId(id) && !this.isRelativeId(id);
};


/**
 * Normalizes a filepath.
 * @param {string} filepath The filepath.
 * @param {string} basedir The base directory.
 * @return {string} The normalized path.
 * @this exports
 */
exports.normalize = function(filepath, basedir) {
  basedir = basedir || process.cwd();

  if (filepath == '*.js') {
    filepath = basedir;
  }
  else if (!this.isAbsoluteId(filepath)) {
    filepath = path.join(basedir, filepath);
  }

  if (!path.existsSync(filepath)) {
    filepath += '.js';
    if (!path.existsSync(filepath)) {
      throw 'This file or directory does not exist: ' + filepath;
    }
  }

  return filepath;
};


/**
 * Gets the default output filepath for spm build.
 * @param {string} inputFile The input filepath.
 * @return {string} The output filepath.
 */
exports.getDefaultOutputFilepath = function(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), config.DEFAULT_BUILD_DIR);
  exports.mkdirSilent(outputDir);
  return path.join(outputDir, path.basename(inputFile));
};


/**
 * Read content from filepath.
 * @param {string} filepath currently support http/https/filesystem.
 * @param {function} callback Callback to read content.
 */
exports.readFromPath = function(filepath, callback) {
  if (!filepath || typeof callback !== 'function') {
    return;
  }

  var uri = filepath;

  // read from network, support http/https currently.
  if (/^https?:\/\//.test(uri)) {
    uri = url.parse(uri);
    uri.path = uri.pathname;

    require(uri.protocol.slice(0, -1)).get(uri, function(res) {

      if (res.statusCode === 200) {
        var data = '';
        res.on('data', function(chuck) { data += chuck.toString(); })
           .on('end', function() { callback(data); });
        return;
      }

      var redirect = res.headers['location'];
      if (redirect) {
        exports.readFromPath(redirect, callback);
      }
      else {
        console.error('No data received from %s.', filepath);
        callback('');
      }

    }).on('error', function(e) {
      console.error(e.message);
      callback('');
    });
  }
  // read from local filesystem
  else {
    path.exists(uri, function(exists) {
      if (exists) {
        fs.readFile(uri, function(err, data) {
          if (!err) {
            callback(data.toString());
          } else {
            console.error(err.toString());
            callback('');
          }
        });
      } else {
        console.error('File Not Found: %s', uri);
        callback('');
      }
    });
  }
};


/**
 * Download a file stream.
 * @param {string} uri filepath, currently support http/https/filesystem.
 * @param {string} filename local filename.
 * @param {function} callback Callback to read content.
 */
exports.download = function(uri, filename, callback) {
  if (/^https?:\/\//.test(uri)) {
    exports.readFromPath(uri, function(data) {
      fs.writeFile(filename, data, callback);
    });
  }
};
