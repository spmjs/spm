var path = require('path');
var fsExt = require('../utils/fs_ext.js');
var exec = require('child_process').exec;

var argv = require('optimist').argv;

module.exports = function(filePath, callback) {

  console.log('  Start using yuicompressor-2.4.7 to compress js file...');
  var dir = path.dirname(module.filename);
  var cmd = 'java -jar ' + dir + '/yuicompressor-2.4.7.jar ' + filePath;
  console.log('  Begin compress ' + filePath);

  // add options

  cmd = addOptions(cmd);
  console.log('yui js compress cmd---->', cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('  compress ' + path.basename(filePath) + ' success!');
    callback(stdout);
  });
};

// options ref http://developer.yahoo.com/yui/compressor/
function addOptions(cmd, filePath) {
  var args = argv['compress-options']; 
  if (typeof args !== 'string') {
    args = '';
  }

  args = args.split(',');
  var opt;

  while (args.length > 0) {
    opt = args.shift(); 
    if (opt === 'v') {
      opt = 'verbose';
    }

    if (opt) {
      cmd += (' --' + opt + '=true');  
    }
  }

  return cmd + ' --charset=' + (argv.charset || 'utf8');
}
