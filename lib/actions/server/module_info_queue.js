var path = require('path');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var fs = require('fs');

var env = require('../../utils/env.js');
var fsExt = require('../../utils/fs_ext.js');

var DEFAULT_ROOT = '.';

// 模块队列列表.
var ModuleInfoQueue = function(rootPath) {
  this.rootPath = rootPath;

  // 每一个Info.json都会对应一个自己的处理队列.
  this.qs = {};
};


/**
 * module/info.json
 * {
 *   name: 'moduleName',
 *   versioning: {
 *     latest: '1.1.2', //最新上传的版本.
 *     release: '1.1.0' //最新上传的稳定版本.
 *   },
 *   versions: {
 *     '1.1.1': ['a.js', 'b.js']
 *     '1.1.2': ['a.js', 'b.js']
 *     '1.1.3': ['a.js', 'b.js']
 *   },
 *   lastUpdated: 20120712055057 // 上次更新时间.
 * }
 */

/**
 * root/info.json 只记录模块和他的版本和其中的子模块.
  {
    "alipay": "alipay",
    "async": {
        "0.1.15": ["async.js"],
        "0.1.16": ["async.js"],
        "0.1.18": ["async.js"],
        "0.1.22": ["async.js"]
    },
    "backbone": {
        "0.5.3": ["backbone.js"],
        "0.9.1": ["backbone.js"],
        "0.9.2": ["backbone.js"]
    }
  }
*/

// 考虑并发. 通过构建一个模块队列，所有需要注册信息都仍到队列中。
// 当queue.drain 的时候输出模块信息.

ModuleInfoQueue.prototype.register = function(root, config) {
 var that = this;

 if (root === '#') root = '';

 // 首先注册模块到 root/module/info.json 中
 var moduleInfoQueue = this.getQueue(root, config.name);

 moduleInfoQueue.add(config.name, config).on('end', function(info) {
   if (root) {

     // 需要把sub root 注册到 /info.json 中.
     that.getQueue(DEFAULT_ROOT).add(root, root);
   }

   // 把模块注册到 root/info.json 中
   that.getQueue(root || DEFAULT_ROOT).add(info.name, info);
 });
};

// id ==> root/module.name
// 目前有三类info.json，处理方式不太一样，需要单独进行处理
// 如果只传入root, 则获取root info.json
// 如果传入root 和 name 则为模块 info.json
ModuleInfoQueue.prototype.getQueue = function(root, name) {
  if (!root) root = DEFAULT_ROOT;
  if (!name) name = '';

  var queueId = path.join(root, name);
  var mq = this.qs[queueId];
  if (mq) return mq;

  return this.qs[queueId] = new InfoQueue(root, queueId);
};

function InfoQueue(root, id) {
  EventEmitter.apply(this);
  this.rootPath = process.cwd();
  this.root = root;
  this.id = id;
  this.infoPath = path.join(this.rootPath, id, 'info.json');
  this.info = this.getInfo();

  if (id == root) {
    this.initRootQueue();
  } else {
    this.initModuleQueue();
  }

  this.queue.drain = function() {
    this.outputInfo();
    this.emit('end', this.info);
  }.bind(this);
}

InfoQueue.prototype.getInfo = function() {
  var infoPath = this.infoPath; 
  if (!fsExt.existsSync(infoPath)) {
    return {};
  }
  return eval('(' + fs.readFileSync(infoPath) + ')');
};

InfoQueue.prototype.initModuleQueue = function() {

  // console.info('initModuleQueue', this.id, this.root);
  // 注册模块info root/moduleName/info.json
  // 初始化基本信息.
  var that = this;
  var info = this.info;
  info.versioning = info.versioning || {};
  info.versions = info.versions || {};

  this.queue = async.queue(function(task, callback) {
    var name = task.name;
    var config = task.config;
    var version = config.version;

    info.root = config.root || '';
    info.name = info.name || config.name;
    info.tag = config.tag || '';
    info.type = config.type || '';
    info.description = config.description || '';
    info.versioning.latest = config.version;
    info.versions[version] = that._initSubModules(config);
    info.stable = info.stable || [];

    if (config.stable && info.stable.indexOf(version) < 0) {
      info.stable.push(version);
    }
    
    info.lastUpdated = new Date().getTime();

    // adjust order
    var _versioning = info.versioning;
    var _versions = info.versions;

    delete info.versioning;
    delete info.versions;

    info.versioning = _versioning;
    info.versions = _versions;
    callback();
  }, 1);
};

InfoQueue.prototype._initSubModules = function(config) {
  var subModulesDir = path.join(path.dirname(this.infoPath), config.version); 
  var output = config.output;

  if (output) {
    var _output = [];
    Object.keys(output).forEach(function(key) {
      if (/\*/.test(key)) {
        fsExt.globFiles(key, subModulesDir).forEach(function(subKey) {
          if (isValidSubMod(subKey)) {
            _output.push(subKey);
          }
        });
      } else {
        _output.push(key);
      } 
    });
    return _output;
  } else {
    return fsExt.globFiles('**/*.*', subModulesDir).filter(function(f) {
      return isValidSubMod(f);
    });
  }
};

function isValidSubMod(modName) {
  if (/(\.json|\.tgz|-debug\.js)$/.test(modName)) return false;
  if (/^(src|dist|tests|example)/.test(modName)) return false;
  return true;
}

InfoQueue.prototype.initRootQueue = function() {

  // console.info('initRootQueue', this.id, this.root );
  var that = this;
  var info = this.info;

  // root/info.json or  根 info.json 
  this.queue = async.queue(function(task, callback) {
    var name = task.name;
    var config = task.config;

    // 防止有模块名和root冲突.
    if (typeof config === 'string') {
      info[name] = config;
      callback();
    } else {
      info[name] = info[name] || {};
      info[name].root = config.root || '';
      info[name].name = name;
      info[name].tag = config.tag || '';
      info[name].type = config.type || '';
      info[name].description = config.description || '';
      info[name].versions = config.versions || {}; 
      info[name].stable = config.stable || [];
      callback();
    }
  }, 1);
};

InfoQueue.prototype.add = function(name, config) {
  this.queue.push({name: name, config: config});
  return this;
};

// 输出info.json
InfoQueue.prototype.outputInfo = function() { 
  if (this.flush) {
    clearTimeout(this.flush);
    this.flush = null;
  }

  this.flush = setTimeout(function() {
    var infoPath = this.infoPath;
    var info = this.info;
    fsExt.writeFileSync(infoPath, JSON.stringify(info));
    console.info('update info: ', infoPath); 
  }.bind(this), 100);
};

Object.keys(EventEmitter.prototype).forEach(function (k) {
  InfoQueue.prototype[k] = EventEmitter.prototype[k];
});

module.exports = ModuleInfoQueue;
