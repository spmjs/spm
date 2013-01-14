'use strict';

var util = require('util'),
  path = require('path'),
  exec = require('child_process').exec,
  spawn = require('child_process').spawn;

console.info('Start using google closure compress!');

module.exports = function(code, callback) {
  var dir = path.dirname(module.filename);
  var cmd = 'java -jar ' + dir + path.sep + 'compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js ' + code;
  console.log('Begin compress ' + code);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('compress ' + path.basename(code) + ' success!');
    callback(stdout);
  });
};

