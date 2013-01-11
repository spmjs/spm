// 对于指定的目录进行扫描，生成tgz和info.json信息.
// 目前扫描主要是针对源服务，其他目录格式不支持, 其中有下面几个约定.
// 1. 根目录下面会有一个config.json, 这个表明是跟项目，里面需要配置root等信息.
// 2. 根目录下面所有的目录都讲被认为是模块名. 模块目录下面为版本列表。
var fs = require('fs');
var util = require('util');
var path = require('path');
var async = require('async');
var request = require('request');
require('shelljs/global');

var tar = require('../utils/tar.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var ActionFactory = require('../core/action_factory.js');
var ModuleInfoQueue = require('./server/module_info_queue.js');

var Sources = ActionFactory.create('Sources');

var fileDir = process.cwd();

var CONFIG = 'config.json';
var MQ = new ModuleInfoQueue(fileDir);
var argv;

Sources.prototype.registerArgs = function() {
  this.opts.description('源数据扫描相关操作');

  this.opts.on('--help', function() {
    console.info();
    console.info('   详情查看: ' + 'https://github.com/spmjs/spm/wiki/如何搭建一个源服务'.underline);
  });
};

Sources.prototype.execute = function(options, callback) {
  argv = options;
  var configPath = path.join(fileDir, CONFIG);
  if (!fsExt.existsSync(configPath)) {
    throw new Error(configPath + 'not found config.json');
  }

  if (argv.stable) {
    addStableInfo(callback);
  } else {
    var modules = new Modules(argv.root || '', fileDir, callback, true);
  }
};


function Modules(root, baseDir, callback, isParse) {
  var that = this;
  this.baseDir = baseDir;
  var tempDir = this.tempDir = path.join(baseDir, '_build');

  var queue = this.queue = async.queue(function(mod, callback) {
    var modPath = path.join(baseDir, mod);

    // 模块检查，如果发现目录里面存在config.json文件则说明是模块集合
    if (fsExt.existsSync(path.join(modPath, CONFIG))) {

      // 如果次模块也是一个根目录，那么直接只是把root名字写上.
      // 那如果用户install 一个root 是否install 下面全部子模块.
      new Modules(mod, modPath, function() {
        callback();
      }, true);
      return;
    }

    var versions = [];
    if (moduleHelp.isVersion(path.basename(modPath))) {
      versions.push(path.basename(modPath));
      modPath = path.dirname(modPath);
    } else {
      versions = fsExt.listDirs(modPath);
    }

    // 1. 查找版本
    async.forEach(versions, function(ver, callback) {

      var configPath = path.join(modPath, ver, 'package.json');
      if (!fsExt.existsSync(configPath)) {
        console.warn('module information not complete!');
        callback();
        return;
      }

      var config = eval('(' + fs.readFileSync(configPath) + ')');

      var modInfo = {};
      modInfo.name = config.name || mod;
      modInfo.version = config.ver || ver;
      modInfo.root = config.root || root;

      modInfo.tag = config.tag || '';
      modInfo.type = config.type || '';
      modInfo.description = config.description || '';

      that.parseModule(modInfo.root, modPath, modInfo.name, modInfo.version, function(subMods) {
        modInfo.output = subMods;
        MQ.register(modInfo.root, modInfo);
        callback();
      });
    }, function() {
      callback();
    });

  }, 1);

  queue.drain = function() {
    // 收集所有子模块的info.json, 产生总的info.json
    // 1. clean tempDir
    // 2 write modsInfo;
    fsExt.rmdirRF(tempDir);
    // console.info(modsInfo);
    //
    console.info('module parse succ!');
    callback();
  };

  if (isParse && argv.extras && argv.extras.length) {
    this.parseModules(argv.extras);
    argv.extras = null;
  } else {
    this.parseModules();
  }
}

Modules.prototype.parseModules = function(modDir) {
  // modsInfo.root = configObj.get('root');
  var that = this;
  var mods;
  if (modDir) {
     mods = modDir;
  } else {
    mods = fsExt.listDirs(this.baseDir, function(dir) {
      if (dir.indexOf('.') === 0) return false;
      if (dir.indexOf('_') === 0) return false;
        return true;
    });
  }

  if (mods.length === 0) {
    that.queue.drain();
  }

  mods.forEach(function(mod) {
    that.queue.push(mod);
  });
};

Modules.prototype.parseModule = function(root, modPath, modName, ver, callback) {
  console.info('parsing module ' + modName + ' .....');
  var that = this;
  var codePath = path.join(modPath, ver);
  this.createTar(root, modName, ver, codePath, function() {
    callback(that.getSubMods(codePath));
  });
};

// TODO 后续可能还需要计算依赖.
Modules.prototype.getSubMods = function(codePath) {

  // 主要是获取模块子模块信息
  var mods = fsExt.globFiles('**/*.*', codePath);
  mods = mods.filter(function(m) {
    var ext = path.extname(m);
    if (!ext) return false;
    if (/(\.json|\.tgz|-debug\.js)$/.test(m)) return false;
    if (/^(src|dist|tests|example)/.test(m)) return false;
    return true;
  });

  var output = {};
  mods.forEach(function(mod) {
    output[mod] = "";
  });
  return output;
};

Modules.prototype.createTar = function(root, modName, ver, codePath, callback) {
  var tarName = modName + '.tgz';
  var tarPath = path.join(codePath, tarName);

  if (tarPath) {
    // 已经存在tar包
    // callback();
    rm(tarPath);
    // return;
  }

  // 模块临时目录.
  var tempModulePath = path.join(this.tempDir, modName, ver, modName);
  var tempDistPath = path.join(tempModulePath, 'dist');

  fsExt.mkdirS(tempDistPath);
  fsExt.copydirSync(codePath, tempDistPath);


  if (!fsExt.existsSync(path.join(tempModulePath, 'package.json'))) {
    var pInfo = {
      root: root,
      name: modName,
      version: ver
    }
    echo(JSON.stringify(pInfo)).to(path.join(tempModulePath, 'package.json'));
  }

  tar.create(tempModulePath, tarPath, function() {
    console.log('pack tar ' + tarPath + ' success!');
    callback();
  });
};

function addStableInfo(cb) {
  var infosPath = fsExt.listFiles(process.cwd(), /info\.json$/);
  async.forEach(infosPath, function(infoPath, cb) {
    var info = JSON.parse(fsExt.readFileSync(infoPath));
    if (!info.versions) {
      cb();
      return;
    }
    getStableVersion(info, function(stableVers) {
      info.stable = stableVers;
      fsExt.writeFileSync(infoPath, JSON.stringify(info));
      cb();
    })
  }, function() {
    cb();
  });
}

function getStableVersion(info, cb) {
  var versions = info.versions;
  var stableVers = [];
  var baseUrl = 'https://a.alipayobjects.com';

  async.forEach(Object.keys(versions), function(ver, cb) {
    var modName = versions[ver][0];
    var modId = getModuleId(info, ver, modName);
    if (path.extname(modId) !== '.js') {
      modId = modId + '.js';
    }
    request(baseUrl + '/' + modId, function(err, res) {
      if (err) {
        console.warn('网络异常 ' + baseUrl + '/' + modId);
      }
console.info('request------>', baseUrl + '/' + modId, res.statusCode);
      if (res.statusCode == 404) {
        cb();
      } else {
        stableVers.push(ver);
        cb();
      }
    });

  }, function() {
    cb(stableVers);
  });
}

function getModuleId(info, ver, name) {
  return moduleHelp.generateModuleId({
    root: info.root || '',
    name: info.name,
    version: ver,
    moduleName: name
  });
}

Sources.Modules = Modules;
module.exports = Sources;
