'use strict';

var util = require('util'),
  path = require('path'),
  exec = require('child_process').exec,
  spawn = require('child_process').spawn;

module.exports = function(code, callback) {
  console.log('  Start using yuicompressor-2.4.7 to compress css file...');
  var dir = path.dirname(module.filename);
  var cmd = 'java -jar ' + dir + '/yuicompressor-2.4.7.jar ' + code;
  console.log('  Begin compress ' + code);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('  compress ' + path.basename(code) + ' success!');
    callback(stdout);
  });
};

