'use strict';

var util = require('util');
var path = require('path');
var fsExt = require('../utils/fs_ext.js');
var cleanCSS = require('clean-css');

module.exports = function(cssPath, callback) {
  console.log('  Start using clean-css to compress css file...');
  var code = fsExt.readFileSync(cssPath);
  console.log('  Begin compress ' + cssPath);
  console.log('  compress ' + path.basename(code) + ' success!');
  callback(cleanCSS.process(code));
};

