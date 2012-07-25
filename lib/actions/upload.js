var fs = require('fs');
var util = require('util');
var path = require('path');
var util = require('util');

var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');

var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('./action_factory.js');


var Upload = ActionFactory.create('Upload');

var argv = require('optimist').
  usage('Usage: $0 -m [moduleName] -s [srouce path] -l [upload to local] -r [project root]')[
  'default']('s', '').
  argv;

Upload.prototype.run = function() {
  var that = this;
  var modulePath = argv.m;
  var modules = [];
  if (argv.m) {
    modules.push(argv.m);
  }
  if (argv._.length > 1) {
    modulePath = argv._[1];
    modulePath = path.join(process.cwd(), modulePath);
    modules = modules.concat(fs.readdirSync(modulePath));
  }

  var tempDir = path.join(process.cwd(), '_build');
  fsExt.rmdirRF(tempDir);

  fsExt.mkdirS(tempDir);

  modules.forEach(function(module) {
    if (module.indexOf('_') === 0) return;
    that.parseDir(tempDir, module);
  });
  return;
};

Upload.prototype.parseDir = function(tempDir, moduleName) {
  var that = this;

//console.log('parseDir---->',tempDir, moduleName);
  // 2. copy dist dir to _build/moduleName
  // 3. compress _build/moduleName
  // 模块临时目录.
  var buildDir = path.join(tempDir, moduleName);

  // 模块代码目录
  var distPath = path.join(process.cwd(), moduleName);

  var files;
  var file;
  // 找到具体的模块目录. 就是里面包含有文件的目录.
  while (!isTargetDir(distPath)) {
    files = fs.readdirSync(distPath);
    file = files[0];
    if (file.indexOf('.') == 0) {
      file = files[1];
    }
    distPath = path.join(distPath, file);
  }
  var relaPath = path.relative(process.cwd(), distPath);

  // 找到所有的版本.
  var versions = fs.readdirSync(path.join(distPath, '../')).filter(function(version) {
    if (version.indexOf('.') === 0) {
      return false;
    }
    return true;
  });
  versions.forEach(function(version) {
    var versionDistPath = path.join(distPath, '../', version);
    var buildModulePath = path.join(buildDir, version, moduleName, 'dist');
    fsExt.mkdirS(buildModulePath);
    fsExt.copydirSync(versionDistPath, buildModulePath);
    var tarName = moduleName + '.tgz';
    var sourceDir = path.join(process.env.HOME, '.spm', 'sources', argv.s, argv.r, relaPath, '../', version);
    fsExt.mkdirS(sourceDir);
    that.uploadTarToLocal(path.join(buildModulePath, '../'), sourceDir, tarName);

    if (argv.l) {
      var sourceLocalDir = path.join(process.cwd(), argv.l, argv.r, relaPath, '../', version);
//console.log('s------------', sourceLocalDir, buildModulePath);
      that.uploadTarToLocal(path.join(buildModulePath, '../'), sourceLocalDir, tarName);

    }
  });
};

Upload.prototype.uploadTarToLocal = function(distPath, buildDir, tarName) {
  console.log('Upload tar: ' + tarName + ' to ' + buildDir);
  fstream.Reader({path: distPath, type: 'Directory'}).pipe(tar.Pack())
      .pipe(zlib.createGzip())
      .pipe(fstream.Writer(path.join(buildDir, tarName)));
};

// 检查此目录是否是最终的目录.
function isTargetDir(dir) {
  var files = fs.readdirSync(dir);
  return files.some(function(file) {
    return fs.statSync(path.join(dir, file)).isFile();
  });
}

function getProjectInfo(dir) {
  return eval('(' + fsExt.readFileSync(dir, 'package.json') + ')');
}

function getProjectId(projectDir) {
    return projectDir.slice(projectDir.lastIndexOf('/') + 1,
        projectDir.length);
}

module.exports = Upload;

