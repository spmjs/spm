
// 部署模块到远程服务器.
var path = require('path');
var _ = require('underscore');
var async = require('async');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var env = require('../utils/env.js');
var Plugin = require('../core/plugin.js');

var deployPlugin = module.exports = Plugin.create('deploy');

deployPlugin.param('to', null, 'deploy to local.');

var LOCAL = 'local';
var DEFAULT = 'default';

deployPlugin.run = function(project, callback) {
  var deploy = project.deploy;
  var that = this;
  var to = project.getConfig('to') || 'default';

  if (!deploy || _.isEmpty(deploy)) {
    // console.warn('Not found deploy or servers config!');
    callback('没有发现部署配置!');
    return;
  } 

  deploy = adaptOldConfig(deploy, project.servers);
  deploy = this.parseDeployConfig(to, deploy);

  console.log('开始到指定的服务--->', deploy);
  async.forEach(Object.keys(deploy), function(key, cb) {
    var config = deploy[key];
    
    console.info('Begin deploy ' + project.name + ' to ' + key);
    if (key === LOCAL) {
      that.deployToLocal(project, key, config, cb); 
    } else {
      that.deployToServer(project, key, config, cb);
    }
  }, function() {
    callback();
  });
};

function adaptOldConfig(deploy, servers) {
  var defaultConfig = deploy[DEFAULT] = deploy[DEFAULT] || {};
  var tempDefault = {};
  var defaultKeys = ['root', 'host', 'path'];

  Object.keys(deploy).forEach(function(key) {
    if (defaultKeys.indexOf(key) > -1) {
      tempDefault[key] = deploy[key];
      delete deploy[key];
    }
    if (key === 'server') {
      var userInfo = servers[deploy.server];
      tempDefault = _.defaults(tempDefault, userInfo);
      delete deploy[key];
    }
  });

  deploy[DEFAULT] = _.defaults(deploy[DEFAULT], tempDefault);
  return deploy;
}

// 解析出上传模块
deployPlugin.parseDeployConfig = function(tos, deploy) {
  var new_deploy = {};

  if (tos.indexOf(',') > -1) {
    tos = tos.split(',');
  } else {
    tos = [tos];
  }
  tos.forEach(function(to) {
    to = to.trim();
    if (!deploy[to]) {
      if (!deploy.local) {
        new_deploy.local = {
          path: perfectLocalPath(to)
        };
      } else {
        console.warn('无法找到相关的部署配置 ' + to);
      }
    } else {
      if (to === 'local') {
        new_deploy.local = {
          path: perfectLocalPath(deploy.local.path)
        }
      } else {
        new_deploy[to] = _.defaults(deploy[to], deploy[DEFAULT]);
      }
    }
  });

  if (_.isEmpty(new_deploy)) {
    new_deploy[DEFAULT] = deploy[DEFAULT];
  }

  console.log('部署模块列表:' + JSON.stringify(new_deploy));

  return new_deploy;
};

deployPlugin.deployToServer = function(project, key, server, callback) {
  var moduleName = project.name;
  var dir = path.join(path.dirname(module.filename), '../help/sshj-0.9.4.jar');

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

  if (server.port) {
    cmd.push('-P ' + server.port);
  }

  cmd = cmd.join(' ');

  console.log('执行命令:' + cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.empty();
      console.error('执行命令:' + cmd + ' 错误!');
      console.empty();
      console.error('exec error: ' + error);
      return;
    }
    console.info('Deploy ' + moduleName + 'to ' + key + ' success!');
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
  console.info('Deploy ' + project.name + ' to ' + key + ' success!');
  callback();
};

function perfectLocalPath(localPath) {
  if (!env.isAbsolute(localPath)) {
    return path.join(process.cwd(), localPath);
  }
}
