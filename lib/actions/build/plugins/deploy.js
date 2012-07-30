
// 部署模块到远程服务器. 
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fsExt = require('../../../utils/fs_ext.js');

/**
 * 清除工作空间，build目录.
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {

  console.info('--- SPM DEPLOY PLUGIN ---')
  console.empty();
    
  var moduleName = project.name;
  if (!project.deploy || !project.servers) {
    console.warn('Not found deploy or servers config!');
    callback();
  }

  var dir = path.join(path.dirname(module.filename), '../help/scp-0.9.0-dev.jar');
  var deploy = project.deploy;
  var servers = project.servers;
  var server = servers[deploy.server];

  var host = deploy.host;
  var username = server.user;
  var password = server.pass;
  var root = project.root;
  if (root == '#') {
    root = server['#'] || 'arale';
  }
  var remotePath = path.join(deploy.path, root, project.name, project.version);
  var localPath = path.join(project.baseDirectory, 'dist');
  var cmd = [];
  cmd.push('java -jar ' + dir);
  cmd.push('-h ' + host);
  cmd.push('-l ' + localPath);
  cmd.push('-r ' + remotePath);
  cmd.push('-u ' + username);
  cmd.push('-p ' + password)
  cmd = cmd.join(' ');

  console.info('Begin deploy ' + moduleName);
  console.log('cmd----->', cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.error('exec error: ' + error);
      return;
    }

    console.info('Spm deploy plugin execution successfully!');
    console.empty();

    callback();
  });

};
