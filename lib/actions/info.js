var request = require('request');
var fs = require('fs');
var path = require('path');
var async = require('async');
var semver = require('semver');
var prettyJson = require('prettyjson');

// 工具类加载
var ActionFactory = require('../core/action_factory.js');
var fsExt = require('../utils/fs_ext.js');
var help = require('../utils/module_help.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var fileDir = process.cwd();
var Info = ActionFactory.create('Info');

Info.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('show module info.');
  opts.add('r', 'root', 'set module root.');
  opts.defaultValue('root', '');
};

var argv;

var errMsg = 'Unable to get the information you need. Please check your configuration!';
Info.prototype.execute = function(options, callback) {
  argv = options;
  if (argv.extras.length < 1) {
    console.error('Required parameter missing!');
    console.info(this.help());
    return;
  }

  var arg = argv._[3];

  var modInfo = this.createOptions(getModInfoByArg(arg));
  ProjectFactory.getProjectModel('info', modInfo, function(model) {
    model.getSourceModuleInfo(function(sourceModsInfo) {
      var mod;
      var root = modInfo.getConfig('root');
      var name = modInfo.getConfig('name');
      var ver = modInfo.getConfig('version');

      if (root) {
        mod = sourceModsInfo[root][name];
      } else {
        mod = sourceModsInfo[name];
      }
      
      var versions = mod.versions || {};

      if (!mod || (ver && (Object.keys(versions).indexOf(ver) < 0))) {
        console.info('not found module ' + arg);
      } 

      if (ver) { 
        mod.version = ver;
        delete mod.versions;
      } 
      console.info(prettyJson.render(mod));
      callback();
    });
  });
};

function getModInfoByArg(arg) {
  var modInfo = {};
  var parts = arg.split('@');
  var name = modInfo.name = parts[0];

  modInfo.version = parts[1] || null;
  if (name.indexOf('.') > 0) {
    name = name.split('.');
    modInfo.root = name[0];
    modInfo.name = name.splice(1).join('.');
  }
  return modInfo;
}

/**
// 根据用户传入的模块名称，获取模块基本信息.
function getModInfoByArg(arg) {
  modInfo.name = name;

  return modInfo;
}
**/

module.exports = Info;
