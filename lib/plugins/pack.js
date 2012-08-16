var path = require('path');
var fs = require('fs');
var request = require('request');
var fsExt = require('../utils/fs_ext.js');
var tar = require('../utils/tar.js');
var Plugin = require('../core/plugin.js');

var packPlugin = module.exports = Plugin.create('pack');

// 1. create build/moduleName dir.
// 2. copy src, dist, package.json to module dir.
// 3. compress module dir to tar.
// 5. upload tar to local.
packPlugin.run = function(callback) {
  var project = this.project;

  // 准备压缩包临时目录
  var tempTarPath = path.join(project.buildDirectory, '_tar', project.name);
  var tempDistPath = path.join(tempTarPath, 'dist');
  var tempSrcPath = path.join(tempTarPath, 'src');

  fsExt.mkdirS(tempDistPath);
  fsExt.mkdirS(tempSrcPath);

  fsExt.copydirSync(project.srcDirectory, tempSrcPath);
  fsExt.copydirSync(project.distDirectory, tempDistPath);
  fsExt.copyFileSync(project.baseDirectory, tempTarPath, 'package.json');

  var root = project.root;
  if (root === '#') {
    root = '';
  }

  var tarName = project.name + '.tgz';

console.log(' pack tar ' + tarName + ' to ' + tempTarPath);

  var tarPath = path.join(tempTarPath, tarName);

  tar.create(tempTarPath, tarPath, function() {
    console.log('pack tar ' + tarPath + ' success!');
    callback();
  });
};


