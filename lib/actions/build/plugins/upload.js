// upload tar to server.
var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var request = require('request');

var argv = require('optimist').
    usage('Usage: $0 --server[deploy module to server]')[
    'default']('server', true).
    argv;

module.exports = function(project, callback) {
  var source = project.getSource();
  if (!source) {
    console.warn(' The source unavailable!');
    callback();
    return;
  }

  var tarName = project.name + '.tgz';
  var sourceDir = path.join(project.baseSourcePath,
      project.baseModuleDir);

  var tarPath = path.join(sourceDir, tarName);

  uploadTarToServer(tarPath, source, callback);
};

// TODO test sources is available
function uploadTarToServer(tarPath, source, callback) {
console.log(' upload tar to server ', tarPath, source);
  fs.createReadStream(tarPath).
    pipe(request.put(source)).
    on('end', function() {
      console.log('');
      console.log(' The plugin upload completed successfully!');
      console.log('')
      callback();
    });
}
