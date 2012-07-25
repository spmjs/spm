// upload tar to server.
//
var argv = require('optimist')
    .usage('Usage: $0 --server[deploy module to server]')
    .default('server', true)
    .argv;

module.exports = function(project, callback) {

  // TODO test sources is available
  var tarModuleDir = path.join(project.buildDirectory, '_tar', project.name);
  var packagePath = path.join(project.baseDirectory, 'package.json');
  var distDir = path.join(tarModuleDir, 'dist');
  var srcDir = path.join(tarModuleDir, 'src');

};

//
function checkSource(project) {

uploadTarToServer(tarPath, sources[0]);
}

function uploadTarToServer(tarPath, source) {
console.log(' uploadTarToServer ', tarPath, source);
  fs.createReadStream(tarPath).
    pipe(request.put(source)).
    on('end', function() {
      console.log('');
      console.log(' The plugin pack completed successfully!');
      console.log('')
    });
}
