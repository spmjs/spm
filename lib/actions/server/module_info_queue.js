var path = require('path');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var fs = require('fs');

var env = require('../../utils/env.js');
var fsExt = require('../../utils/fs_ext.js');

var rootId = '.';

// 模块队列列表.
var ModuleInfoQueue = function(rootPath) {
  this.rootPath = rootPath;

  // 每一个Info.json都会对应一个自己的处理队列.
  this.qs = {};
  
  // 默认初始化一个根目录的info.json对象.
  var infoPath = path.join(this.rootPath, rootId, 'info.json');
  this.qs[rootId] = new InfoQueue(rootId, infoPath);
};


/**
 * #info.json
 * {
 *   name: 'moduleName',
 *   versioning: {
 *     latest: '1.1.2', //最新上传的版本.
 *     release: '1.1.0' //最新上传的稳定版本.
 *     versions: ['1.1.2', '1.1.0']
 *   },
 *   subMods: {
 *     '1.1.1': ['a.js', 'b.js']
 *   },
 *   lastUpdated: 20120712055057 // 上次更新时间.
 * }
 */

// 考虑并发. 通过构建一个模块队列，所有需要注册信息都仍到队列中。
// 当queue.drain 的时候输出模块信息.

ModuleInfoQueue.prototype.register = function(root, config) {
 var that = this;
 var moduleInfoQueue = this.getQueue(root, config.name);
 // 注册模块到 root/module/info.json 中

 moduleInfoQueue.add(config).on('end', function(info) {
   if (root) {
     // 需要把root注册到 /info.json 中.
     that.getQueue('.').add(root, root);

     // 把模块注册到 root/info.json 中
     that.getQueue(root).add(info.name, info);
   } else {
     that.getQueue(rootId).add(info.name, info);
   }
 });
};

// id ==> root/module.name
// 目前有三类info.json，处理方式不太一样，需要单独进行处理
// 如果只传入root, 则获取root info.json
// 如果传入root 和 name 则为模块 info.json
ModuleInfoQueue.prototype.getQueue = function(root, name) {
  if (!root) root = rootId;
  if (root === '#') root = rootId;
  if (!name) name = '';

  var queueId = path.join(root, name);
  var mq = this.qs[queueId];
  if (mq) return mq;

  return this.qs[queueId] = new InfoQueue(root, queueId);
};

function InfoQueue(root, id) {
  EventEmitter.apply(this);

  this.root = root;
  this.id = id;
  var infoPath = path.join(this.rootPath, id, 'info.json');
  this.infoPath = infoPath;
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
console.info('initModuleQueue', this.id, this.root);
  // 注册模块info root/moduleName/info.json
  // 初始化基本信息.
  var id = this.id;
  var info = this.info;
  info.versioning = info.versioning || {};
  info.versioning.versions = info.versioning.versions || [];
  info.subModules = info.subModules || {};

  this.queue = async.queue(function(task, callback) {
    var name = task.name;
    var config = task.config;
    info.name = info.name || config.name;
    info.versioning.latest = config.version;
    var versions = info.versioning.versions;
    if (versions.indexOf(config.version) < 0) {
      versions.push(config.version);
    }

    if (!info.subModules) {
      info.subModules = {};
    }

    var subMods = Object.keys(config.output);

    info.subModules[config.version] = subMods;
    info.lastUpdated = new Date().getTime();
    callback();
  }, 1);
};

InfoQueue.prototype.initRootQueue = function() {
console.info('initRootQueue', this.id, this.root );
  var that = this;
  var id = this.id;
  var info = this.info;

  // root/info.json or  根 info.json 
  this.queue = async.queue(function(task, callback) {
    var name = task.name;
    var config = task.config;
    // 防止有模块名和root冲突.
    if (info[name] && typeof config === 'string') {
      callback();
    } else {
      info[name] = config;
      callback();
    }
  }, 1);

};

InfoQueue.prototype.add = function(config) {
console.info('add-------->', config);
  this.queue.push({name: config.name, config: config});
  return this;
};

// 输出info.json
InfoQueue.prototype.outputInfo = function() { 
  var infoPath = this.infoPath;
  var info = this.info;
  fsExt.writeFileSync(infoPath, JSON.stringify(info));
  console.info('update info: ', infoPath); 
};

Object.keys(EventEmitter.prototype).forEach(function (k) {
  InfoQueue.prototype[k] = EventEmitter.prototype[k];
});

module.exports = ModuleInfoQueue;
