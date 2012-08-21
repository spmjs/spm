// upload tar to server.
var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var request = require('request');

var help = require('../utils/moduleHelp.js');

var Plugin = require('../core/plugin.js');
var upload = module.exports = Plugin.create('upload');

upload.run = function(callback) {
  var project = this.project;
  var source = project.getSource();

  if (!source) {
    console.warn(' The source unavailable!');
    callback();
    return;
  }

  // 如果是本地源，则install已经完成相关工作.
  if (help.isLocalPath(source)) {
    callback();
    return;
  }
  var root = project.root || '';
  /**
  if (project.root === '#' && project.alias && project.alias['#']) {
    root = project.alias['#'];
  }
  **/
  console.log('source-->', source);

  if (root) {
    source = source + '/' + project.root;
  }
  var tarName = project.name + '.tgz';

  var tarPath = path.join(this.build, '_tar', project.name, tarName);
  uploadTarToServer(tarPath, source, callback);
};
upload.param('build', '%buildDirectory%');

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
        callback();
      });
    });
}
