var path = require('path');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');

var help = require('../utils/moduleHelp.js');
var fsExt = require('../../../utils/fs_ext.js');

// 1. create build/moduleName dir.
// 2. copy src, dist, package.json to module dir.
// 3. compress module dir to tar.
// 4. upload tar to server.
// 5. upload tar to local.
module.exports = function(project, callback) {
  var tarModuleDir = path.join(project.buildDirectory, '_tar', project.name);
  var packagePath = path.join(project.baseDirectory, 'package.json');
  var distDir = path.join(tarModuleDir, 'dist'); 
  var srcDir = path.join(tarModuleDir, 'src'); 
  
  fsExt.mkdirS(tarModuleDir);
  fsExt.mkdirS(distDir);
  fsExt.mkdirS(srcDir);

  fsExt.copydirSync(project.srcDirectory, srcDir);
  fsExt.copydirSync(project.distDirectory, distDir);
  fsExt.copyFileSync(project.baseDirectory, tarModuleDir, 'package.json');


  // 默认配置文件中的源第一个是项目自身的源.
  var source = help.getHost(project.sources[0]);
  var relaPath = path.join(root, project.name, project.version);
  var tarName = project.name + '.tgz';
  var sourceDir = path.join(process.env.HOME, '.spm', 'sources', source, relaPath);
  fsExt.mkdirS(sourceDir);

  var root = project.root;
  if (root == '#') {
    root = "";
  }

console.log(' upload tar ' + tarName + ' to' + sourceDir);

  fstream.Reader({path: tarModuleDir, type: "Directory"}).pipe(tar.Pack())
    .pipe(zlib.createGzip())
    .pipe(fstream.Writer(path.join(sourceDir, tarName))).on('close', function() {
      console.log('');
      console.log(' The plugin pack completed successfully!');
      console.log('')
    });
};
