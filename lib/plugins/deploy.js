
// 部署模块到远程服务器.
var path = require('path');
var _ = require('underscore');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var Plugin = require('../core/plugin.js');

var deployPlugin = module.exports = Plugin.create('deploy');

deployPlugin.param('to', null, 'deploy to local.');

var LOCAL = 'local';
var DEFAULT = 'default';

deployPlugin.run = function(project, callback) {
  var deploy = project.deploy;
  var to = project.getConfig('to') || 'default';

  if (!deploy || _.isEmpty(deploy)) {
    // console.warn('Not found deploy or servers config!');
    callback('没有发现部署配置!');
    return;
  } 

  deploy = this.parseDeployConfig(to);

  var that = this;
  async.forEach(Object.keys(deploy), function(key, cb) {
    var config = deploy[key];
    
    if (key === LOCAL) {
      that.deployToLocal(project, key, config, cb); 
    } else {
      that.deployToServer(project, key, config, cb);
    }
  });
};

// 解析出上传模块
deployPlugin.parseDeployConfig = function(tos, deploy) {
  var new_deploy = {};

  if (tos.indexOf(',') > -1) {
    tos = tos.split(',');
  } else {
    tos = [tos];
  }

  tos.forEach(function(to) {
    if (!deploy[to]) {
      if (!deploy.local) {
        new_deploy.local = {
          path: path.join(process.cwd(), to) 
        }
      } else {
        console.warn('无法找到相关的部署配置 ' + to);
      }
    } else {
      new_deploy[to] = _.defaults(deploy[to], deploy[DEFAULT]);
    }
  });

  if (_.isEmpty(new_deploy)) {
    new_deploy = deploy[DEFAULT];
  }

  return new_deploy;
};

deployPlugin.deployToServer = function(project, key, server, callback) {
  var moduleName = project.name;
  var dir = path.join(path.dirname(module.filename), '../help/sshj-0.9.3-dev.jar');

  var host = server.host;
  var username = server.user;
  var password = server.pass;
  var root = project.root;

  var remotePath = path.join(server.path, root, project.name, project.version);

  // TEMP fix windows
  remotePath = env.normalizePath(remotePath);

  var localPath = project.distDirectory;
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

deployPlugin.deployToLocal = function(project, key, config, callback) {
  var localPath = project.distDirectory;
  var root = project.root;
  var name = project.name;
  var version = project.version;

  var to = path.join(config.path, root, name, version);
  fsExt.copydirSync(localPath, to);
  callback();
};
