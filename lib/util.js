// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview Utilities for spm.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs'),
    path = require('path'),
    url = require('url');

var config = require('./config');


/**
 * rm -rf dir.
 * @param {string} dir The directory path.
 */
exports.rmdirForce = function(dir) {
  fs.readdirSync(dir).forEach(function(file) {
    var p = path.join(dir, file);
    if (fs.statSync(p).isFile()) {
      fs.unlinkSync(p);
    } else {
      exports.rmdirForce(p);
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
 * Gets the relative parts of path according to current work dir.
 * @param {string} filepath The file path.
 * @param {string} basedir The base directory.
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
      throw 'This file or directory doesn\'t exist: ' + filepath;
    }
  }

  return filepath;
};


/**
 * Gets the default output filepath for sbuild.
 * @param {string} inputFile The input filepath.
 * @return {string} The output filepath.
 */
exports.getDefaultOutputFilepath = function(inputFile) {
  var outputDir = path.join(path.dirname(inputFile), config.DEFAULT_BUILD);
  exports.mkdirSilent(outputDir);
  return path.join(outputDir, path.basename(inputFile));
};


/**
 * Whether call from directly.
 * @param {string} filename The filename.
 * @return {boolean} The boolean result.
 */
exports.isCalledDirectly = function(filename) {
  var argv1 = process.argv[1];
  return argv1 === filename || argv1 + '.js' === filename;
};


/**
 * Read content from filepath.
 * @param {string} path filepath, currently support http/https/filesystem.
 * @param {function} callback Callback to read content.
 */
exports.readFromPath = function(path, callback) {
  if (!path || !callback || !(typeof callback === 'function')) {
    return;
  }
  callback = callback && function() {};

  // read from network, currently http/https supported.
  if (path.indexOf('http') > -1) {
    path = url.parse(path);
    path.path = path.href;
    require(path.protocol.slice(0, -1)).get(path, function(res) {
      console.log('  start query %s..', path.path);
      var data = '';
      res.on('data', function(chuck) {
        data += chuck.toString();
      }).on('end', function() {
        console.log('  done query %s', path.path);
        console.log(callback);
        callback(data);
      });
    }).on('error', function(e) {
      console.error(e.message);
      callback('');
    });
  }

  // read from local filesystem
  else {
    path.exists(path, function(exists) {
      if (exists) {
        fs.readFile(path, function(err, data) {
          if (!err) {
            callback(data.toString());
          } else {
            console.error(err.toString());
            callback('');
          }
        });
      } else {
        console.error('File Not Found: %s', path);
        callback('');
      }
    });
  }
};
