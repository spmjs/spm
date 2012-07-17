var fs = require('fs');
var util = require('util');
var path = require('path');
var util  = require('util');

var fstream = require("fstream");
var tar = require("tar");
var zlib = require("zlib");
var commander = require('commander');

var fsExt = require('./build/utils/fs_ext.js');
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
  modules.forEach(function(module) {
    that.parseDir(module);
  });
  return;
};

Upload.prototype.parseDir = function(moduleName) {
  var that = this;
  var distDir = path.join(process.cwd(), moduleName);
  while(!isTargetDir(distDir)) {
    distDir = path.join(distDir, fs.readdirSync(distDir)[0]);
  }
  distDir = path.join(distDir, '..');
  var relaDir = path.relative(process.cwd(), distDir);
  var versions = fs.readdirSync(distDir);
  var sourceDir = path.join(process.env.HOME, '.spm', argv.s, argv.r, relaDir);
  versions.forEach(function(version) {
    var tarName = moduleName + '-' + version + '.tar.gz';
    that.uploadTarToLocal(path.join(distDir, version), sourceDir, tarName);
  });
};

Upload.prototype.uploadTarToLocal = function(distDir, buildDir, tarName) {
  console.log('Upload tar: ' + tarName + ' to ' + buildDir);
  fstream.Reader({path: distDir, type: "Directory"}).pipe(tar.Pack())
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

