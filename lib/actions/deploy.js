
var fs = require('fs');
var util = require('util');
var path = require('path');
var util  = require('util');
var spawn = require('child_process').spawn;

var fstream = require("fstream");
var tar = require("tar");
var zlib = require("zlib");

var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('./action_factory.js');

var Deploy = ActionFactory.create('Deploy');

Deploy.AVAILABLE_OPTIONS = {
  server: {
    alias: ['-s', '--server'],
    description: 'deploy project to server'
  },
  dist: {
    alias: ['-d', '--deploy'],
    description: 'only deploy project'
  }
};


// 提供 tpl 和 css 是否替换处理插件.
// 用户可以通过命令和package.json覆盖默认行为.
var argv = require('optimist').
    usage('Usage: $0 -d[only deploy project to server]')[
    'default']('d', false).
    argv;

Deploy.prototype.run = function(project) {
  var options = this.options;
  var that = this;

  if (!options.d) {
    var args = process.argv;
    var BuildAction = module.parent.exports['Build'];
    new BuildAction(args.slice(3)).run(function(project) {
      that.deploy(project);
    });
  } else {
    projectFactory.getProjectModel(action, process.cwd(), function(projectModel) {
      that.deploy(projectModel);
    });
  }
};

Deploy.prototype.deploy = function(project) {
  console.log('deploy---->', project);  
};

module.exports = Deploy;
