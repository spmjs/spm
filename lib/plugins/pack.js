var path = require('path');
var fs = require('fs');
var request = require('request');
var _ = require('underscore');
var fsExt = require('../utils/fs_ext.js');
var tar = require('../utils/tar.js');
var Plugin = require('../core/plugin.js');

var packPlugin = module.exports = Plugin.create('pack');

// 1. create build/moduleName dir.
// 2. copy src, dist, package.json to module dir.
// 3. compress module dir to tar.
// 5. upload tar to local.
packPlugin.run = function(project, callback) {

  var base = project.baseDirectory;

  // 准备压缩包临时目录
  var tempTarPath = path.join(project.buildDirectory, '_tar', project.name);
  var tempDistPath = path.join(tempTarPath, 'dist');

  var extra_res = project.getConfig('extraResources') || [];
  if (_.isString(extra_res)) {
    extra_res = extra_res.split(',');
  }

  extra_res.forEach(function(res) {
    var oriPath = path.join(base, res);
    if (!fsExt.existsSync(oriPath)) {
      return;
    }

    var tempResPath = path.join(tempTarPath, res);
    fsExt.mkdirS(tempResPath);
    fsExt.copydirSync(oriPath, tempResPath);
  });

  fsExt.mkdirS(tempDistPath);
  fsExt.copydirSync(project.distDirectory, tempDistPath);

  if (fsExt.existsSync(path.join(base, 'package.json'))) {
    fsExt.copyFileSync(base, tempTarPath, 'package.json');
  }

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


