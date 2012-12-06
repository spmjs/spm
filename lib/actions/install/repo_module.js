var path = require('path');
var async = require('async');
var _ = require('underscore');

var Sources = require('../../core/sources.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');
var StringUtil = require('../../utils/string.js');

var UrlTmpl = 'https://raw.github.com/{{name}}{{version}}/{{modName}}';

function RepoModule(modules, to, debug) {
  this.modules = modules;
  this.to = to;
  this.debug = debug;
}

RepoModule.prototype.install = function(cb) {
  var that = this;
  async.forEach(this.modules, function(mod, cb) {
    mod = mod.replace(/\/$/, '');
    that.installMod(mod, cb);
  }, function() {
    cb();
  });
};

RepoModule.prototype.installMod = function(mod, cb) {
  var that = this;

  async.waterfall([function(cb) {
    getModuleInfo(mod, cb);
  }, function(packageObj, cb) {
    updateInstallInfo(packageObj, that.to, cb);
  }, function(modInfo, cb) {
    installMod(modInfo, that.debug, cb);
  }], function() {
    cb();
  });
};

RepoModule.isRepoMod = function(modules) {
  return _.isArray(modules) && modules.length
     && modules[0].indexOf('/') > 0;
};

function getModuleInfo(mod, cb) {
  // 根据模块 package.json 获取模块信息。

  var modObj = {
    name: mod,
    modName: 'package.json'
  };

  Sources.loadUrl(getModUrl(modObj), function(body) {
    var err = '没有找到合法的 package.json!';

    if (!body) {
      error(err);
    } 

    var packageObj = JSON.parse(body);

    if (!isValidMod(packageObj)) {
      error(err);
    }

    packageObj.modName = mod;

    cb(null, packageObj);
  });
}

function updateInstallInfo(packageObj, to, cb) {
  // 获取需要下载模块的信息和完善模块路径.
  var output = packageObj.output || {};
  var mods = Object.keys(output) || [];

  if (!mods.length) {
    mods.push(packageObj.name + '.js');
  }

  to = path.join(to, packageObj.root, packageObj.name, packageObj.version);

  packageObj.to = to;
  packageObj.mods = mods;

  cb(null, packageObj);
}

function installMod(modInfo, debug, cb) {
  // 下载模块到指定目录.
     
  var mods = modInfo.mods;
  var to = modInfo.to;
  for (var i = 0, len = mods.length; i < len; i++) {
    mods.push(moduleHelp.getDebugModule(mods[i], '-' + debug));
  }
  async.forEach(mods, function(mod, cb) {
    var obj = {
      name: modInfo.modName,
      modName: 'dist/' + mod 
    }; 
   
    Sources.loadUrl(getModUrl(obj), function(body) {
      if (body) {
        fsExt.writeFileSync(path.join(to, mod), body);
      }
      cb();
    });
  }, function() {
    cb(null);
  });
}

function error(err) {
  throw new Error(err);
}

function isValidMod(mod) {
  return mod.root && mod.name && mod.version; 
}

// 根据模块信息，返回 masterUrl 或者 tagUrl
function getModUrl(modObj) {
  if (moduleHelp.containVersion(modObj.name)) {
    modObj.version = '';
  } else {
    modObj.version = '/master';
  }
  return StringUtil.tmpl(UrlTmpl, modObj);
}

module.exports = RepoModule;
