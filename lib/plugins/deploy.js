
// 部署模块到远程服务器.
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('deploy');

plugin.run = function(callback) {
  var project = this.project;
  var moduleName = project.name;

  if (!project.deploy || !project.servers) {

    // console.warn('Not found deploy or servers config!');
    callback('Not found deploy or servers config!');
    return;
  }

  var dir = path.join(path.dirname(module.filename), '../help/sshj-0.9.3-dev.jar');
  var deploy = project.deploy;
  var servers = project.servers;
  var server = servers[deploy.server];

  var host = deploy.host;
  var username = server.user;
  var password = server.pass;
  var root = project.root;
  if (root == '#') {
    root = deploy['#'] || '';
  }
  var remotePath = path.join(deploy.path, root, project.name, project.version);

  // TEMP fix windows
  remotePath = env.normalizePath(remotePath);

  var localPath = path.join(project.baseDirectory, 'dist');
  var cmd = [];
  cmd.push('java -jar ' + dir);
  cmd.push('-h ' + host);
  cmd.push('-l ' + localPath);
  cmd.push('-r ' + remotePath);
  cmd.push('-u ' + username);
  cmd.push('-p ' + password);
  cmd = cmd.join(' ');

  console.info('Begin deploy ' + moduleName);
  console.log('cmd----->', cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.error('exec error: ' + error);
      return;
    }

    callback();
  });

};
