var path = require('path');
var fs = require('fs');
var request = require('request');
var shelljs = require('shelljs');

var fsExt = require('../utils/fs_ext.js');
var tar = require('../utils/tar.js');
var Plugin = require('../core/plugin.js');

var zipPlugin = module.exports = Plugin.create('zip');

zipPlugin.run = function(project, callback) {
  
  if (!this.argv.zip) {
    callback();
    return;
  }    

  var distPath = project.distDirectory; 
  var root = project.root;
  var name = project.name;
  if (root && root === '#') {
    root = '';
  }

  name = path.join(root, name);

  // 准备压缩包临时目录
  var tempZipPath = path.join(project.buildDirectory, '_zip');

  var targetDir = path.join(tempZipPath, name, project.version);

  shelljs.mkdir('-p', targetDir); 
  shelljs.cp('-rf', path.join(distPath, "*"), targetDir);

  var jar = path.join(path.dirname(module.filename), '../help/spm_zip-0.0.1.jar');
  var target = path.join(targetDir, project.name + '.zip');
  var cmd = [];
  cmd.push('java -jar ' + jar);
  cmd.push('-src ' + tempZipPath);
  cmd.push('-target ' + target);
  cmd = cmd.join(' ');

  shelljs.exec(cmd);
  shelljs.cp(target, project.distDirectory);
  callback();
};
