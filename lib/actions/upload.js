var fs = require('fs');
var util = require('util');
var path = require('path');
var util  = require('util');

var fstream = require("fstream");
var tar = require("tar");
var zlib = require("zlib");
var commander = require('commander');

var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('./action_factory.js');


var Upload = ActionFactory.create('Upload');

var argv = require('optimist')
    .usage('Usage: $0 -m [moduleName] -s [srouce path] -l [upload to local] -r [project root]')
    .default('s', 'sources')
    .argv;

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
  if (!fs.existsSync(tempDir)) {
    fsExt.mkdirS(tempDir);
  }
  modules.forEach(function(module) {
    if (module === '_build') return;
    that.parseDir(tempDir, module);
  });
  return;
};

Upload.prototype.parseDir = function(tempDir, moduleName) {
  // 2. copy dist dir to _build/moduleName
  // 3. compress _build/moduleName
  var tempModulePath = path.join(tempDir, moduleName, 'dist');
  fsExt.mkdirS(tempModulePath);

  var that = this;
  var distPath = path.join(process.cwd(), moduleName);
  while(!isTargetDir(distPath)) {
    distPath = path.join(distPath, fs.readdirSync(distPath)[0]);
  }
  var relaPath = path.relative(process.cwd(), distPath);
console.log('distPath--->', distPath, path.relative(process.cwd(), distPath));
  fsExt.copydirSync(distPath, tempModulePath)
  var versions = fs.readdirSync(path.join(distPath, '../'));
console.log(versions)
  versions.forEach(function(version) {
    var tarName = moduleName + '.tgz';
    var sourceDir = path.join(process.env.HOME, '.spm', argv.s, argv.r, relaPath, '../', version);
    fsExt.mkdirS(sourceDir);
    that.uploadTarToLocal(path.join(tempModulePath, '../'), sourceDir, tarName);
  });
};

Upload.prototype.uploadTarToLocal = function(distPath, buildDir, tarName) {
  console.log('Upload tar: ' + tarName + ' to ' + buildDir);
  fstream.Reader({path: distPath, type: "Directory"}).pipe(tar.Pack())
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

