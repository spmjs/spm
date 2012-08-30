var fs = require('fs');
var fs = require('fs');
var util = require('util');
var path = require('path');
var util = require('util');

var tar = require('../utils/tar.js');
var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('../core/action_factory.js');

var Module = ActionFactory.create('Module');

Module.prototype.run = function() {
  var that = this;
  var modules = [];
  var argv = this.opts.argv;

  if (argv._.length > 1) {
    modulePath = argv._[1];
    modulePath = path.join(process.cwd(), modulePath);
    modules = modules.concat(fs.readdirSync(modulePath));
  }

  var tempDir = path.join(process.cwd(), '_build');
  fsExt.rmdirRF(tempDir);
  fsExt.mkdirS(tempDir);

  modules.forEach(function(module) {
    if (fsExt.isFile(path.join(modulePath, module))) return;
    if (module.indexOf('_') === 0 || module.indexOf('.') === 0) return;
    that.parseDir(tempDir, module);
  });
  return;
};

var specFiles = ['transport.js', 'helper.js', 'cookie.zip', 'info.json', 'package.json'];

Module.prototype.parseDir = function(tempDir, moduleName) {
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
    distPath = path.join(distPath, file);
  }

  var relaPath = path.relative(process.cwd(), distPath);
console.info('distpath------>', relaPath);

  // 找到所有的版本.
  var versions = fs.readdirSync(path.join(distPath, '../')).filter(function(version) {
    if (specFiles.indexOf(version) > -1) return false;
    if (version.indexOf('.') === 0) {
      return false;
    }
    return true;
  });
console.info('versions----->', versions);
  versions.forEach(function(version) {
    var versionDistPath = path.join(distPath, '../', version);
    var buildModulePath = path.join(buildDir, version, moduleName, 'dist');
    fsExt.mkdirS(buildModulePath);
    fsExt.copydirSync(versionDistPath, buildModulePath);
    var tarName = moduleName + '.tgz';
    that.uploadTarToLocal(path.join(buildModulePath, '../'), versionDistPath, tarName);
  });
};

Module.prototype.uploadTarToLocal = function(distPath, buildDir, tarName) {
  console.log('Upload tar: ' + tarName + ' to ' + buildDir);
  fstream.Reader({path: distPath, type: 'Directory'}).pipe(tar.Pack())
      .pipe(zlib.createGzip())
      .pipe(fstream.Writer(path.join(buildDir, tarName)));
};

// 检查此目录是否是最终的目录.
function isTargetDir(dir) {
console.info('aaa1', dir)
  if (dir.indexOf('.') === 0) return false;
  var files = fs.readdirSync(dir);
  return files.some(function(file) {
console.info('aaa2', dir, file)
    if (specFiles.indexOf(file) > -1) return false;
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

module.exports = Module;

