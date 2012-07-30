// upload tar to server.
var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var request = require('request');

var argv = require('optimist').
    usage('Usage: $0 --server[deploy module to server]')[
    'default']('server', true).
    argv;

module.exports = function(project, callback) {

  console.info('--- SPM UPLOAD PLUGIN ---')
  console.empty();
  
  var source = project.getSource();
  
  if (!source) {
    console.warn(' The source unavailable!');
    callback();
    return;
  }

  if (project.root && project.root !== '#') {
    source = source + '/' + project.root; 
  }
console.log('source-->', source)
  var tarName = project.name + '.tgz';
  var sourceDir = path.join(project.baseSourcePath,
      project.baseModuleDir);

  var tarPath = path.join(sourceDir, tarName);

  uploadTarToServer(tarPath, source, callback);
};

// TODO test sources is available
function uploadTarToServer(tarPath, source, callback) {
  request(source, function(err, res, body) {
    if (err) {
      console.error('upload source error[' + err.code + ']');
      callback();
      return;
    } 

console.log(' upload tar to server ', tarPath, source);

    fs.createReadStream(tarPath).
      pipe(request.put(source)).
      on('end', function() {

        console.info('Spm upload plugin execution successfully!');
        console.empty();
        callback();
      });
    });
}
