var path = require('path');
var shelljs = require('shelljs');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

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

  if (fsExt.existsSync(path.join(distPath, project.name + '.zip'))) {
    rm(path.join(distPath, project.name + '.zip'));
  }

  // 准备压缩包临时目录
  var tempZipPath = path.join(project.buildDirectory, '_zip', root);

  var targetDir = path.join(tempZipPath, name, project.version);
  shelljs.mkdir('-p', targetDir);

  /**
  var files = shelljs.ls('-R', distPath);

  files = files.filter(function(f) {
    return f.indexOf('_') !== 0;
  }).map(function(f) {
    return path.join(distPath, f);
  });
  **/

  shelljs.cp('-rf', path.join(distPath, '*'), targetDir);
  // fsExt.copydirSync(distPath, targetDir);

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
