
var fs = require('fs');
var util = require('util');
var path = require('path');
var util  = require('util');
var spawn = require('child_process').spawn;

var fstream = require("fstream");
var tar = require("tar");
var zlib = require("zlib");

var fsExt = require('./build/utils/fs_ext.js');
var ActionFactory = require('./action_factory.js');

var Deploy = ActionFactory.create('Deploy');

Deploy.AVAILABLE_OPTIONS = {
  server: {
    alias: ['-s', '--server'],
    description: 'deploy project to server'
  },
  dist: {
    alias: ['-d', '--dist'],
    description: 'only deploy project'
  }
};

Deploy.prototype.run = function() {
  var options = this.options;
  var that = this;

  if (!options.dist) {
    var args = process.argv;
    var BuildAction = module.parent.exports['Build'];
    new BuildAction(args.slice(3)).run(function() {
      that.deploy(options.server);
    });
  } else {
    this.deploy(options.server);
  }
  return;
}

Deploy.prototype.deploy = function(isToServer) {
  var projectDir = process.cwd();
  var project = getProjectInfo(projectDir);
  var projectId = getProjectId(projectDir);
  if (isToServer) {
    throw new Error('Not supprot deploy project to server!');
  
  } else {
    var globalDistDir = path.join(projectDir, '../../dist/', projectId, project.version);

    fsExt.mkdirS(globalDistDir);
    fsExt.copyDirSync(path.join(projectDir, 'build', 'dist'), globalDistDir);
    this.createTar();
    console.log('');
    console.log('  Successfully distributed to: ' + globalDistDir);
    console.log('');
  
  }
};

Deploy.prototype.createTar = function(project) {
  var projectDir = process.cwd();
  var buildDir = path.join(projectDir, 'build');
  var distDir = path.join(buildDir, 'dist');
  var moduleName = projectDir.slice(projectDir.lastIndexOf('/') + 1);
  console.log(moduleName);
  fstream.Reader({path: distDir, type: "Directory"}).pipe(tar.Pack()).
      pipe(zlib.createGzip()).
      pipe(fstream.Writer(path.join(buildDir, moduleName + '.tar.gz')));
};

function getProjectInfo(dir) {
  return eval('(' + fsExt.readFileSync(dir, 'package.json') + ')');
}

function getProjectId(projectDir) {
    return projectDir.slice(projectDir.lastIndexOf('/') + 1,
        projectDir.length);
}

module.exports = Deploy;
