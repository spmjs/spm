// 负责配置文件解析，并返回一个Config对象.

// 配置文件读取: TODO
//   1. 支持远程文件读取(source/config.json).
//   2. 支持本地文件读取(../config.json).
//   3. 读取顺序保证，只有前面一个解析完毕后才能读取下一个.
//   4. 在解析过程中允许动态添加配置模块.
//   5. 支持非规则文件解析, 根据用户后缀进行确定.
//   6. 可以在解析完成后，也可以继续添加配置文件解析.

// 读取顺序(暂不考虑命令行参数, 具体的顺序由使用者来决定). TODO
//   1. project_config.json 
//   2. parent_config.json(如果有的话)
//   3. source_config.json(源配置, sources/config.json)
//   4. golbal_config.json(用户传入)
//   5. spm_config.json(系统配置文件)
//
//   // 目前对于parent_config的解析，需要用户传入对应的处理规则来进行处理.

// 内容合并规则的处理: TODO
//   对象: 不同内容合并，相同内容不覆盖.
//   数组: 内容相同，提升优先级，不同插入到对尾)
//   自定义解析: 支持用户针对某个属性的内容传入自定义解析规则，比如excludes

// 内容获取: TODO
//   当对象获取时，还处在解析状态中，报错。
//   是否支持异步数据获取呢？

var path = require('path');
var request = require('request');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var home = env.home;

var Config = module.exports = function(callback) {

  EventEmitter.apply(this);
  this._obj = {};
  this._state = 'end'; // parsing | end;
  
  var that = this;
  var queue = this._queue = async.queue(function(parseHandler, callback) {
    that._parse();
    parseHandler.call(that, callback);
  }, 1);

  queue.unshift = function(task) {
    queue.tasks.unshift({
        data: task,
        callback: typeof callback === 'function' ? callback : null
    });
  };

  queue.drain = function() {
    that._over();
    that.emit('end', that);
    callback && callback();
    // only run once;
    callback = function() {};
  };

  this._parseRule = {};
};

Config.prototype = {

  get: function(key, fn) {
    var that = this;

    if ((this._state !== 'end') && !fn) {
      throw 'the config is parsing';
    }

    if (arguments.length === 0) {
      return this._obj;
    }

    if (fn) {
      if (this._state !== 'end') {
        this.on('end', function() {
          fn(that._obj[key]);
        }); 
      } else {
        fn(that._obj[key]);
      }
    }

    return this._obj[key];
  },
  
  // 配件某些属性，可以额外的对值进行特殊处理.
  addParseRule: function(key, role) {
    this._parseRule[key] = role;
  },

  set: function(key, value, filepath) {
    var obj = this._obj;
    var baseValue = obj[key];
    var rule = this._parseRule[key] || null;
    if (rule) {
      // 交由用户的parseRule来处理.
      rule.call(this, value, filepath);
    } else {
      if (typeof baseValue === 'undefined') {
        obj[key] = clone(value);
        return;
      }
     
      // 数组合并.
      if (Array.isArray(baseValue)) {
        if (!Array.isArray(value)) {
          value = [value];
        }
        [].splice.apply(baseValue, [baseValue.length, 0].concat(value));
        return;
      }

      // 对象合并
      if (typeof baseValue === 'object' && typeof value === 'object') {
        Object.keys(value).forEach(function(subkey) {
          if (!baseValue.hasOwnProperty(subkey)) {
            baseValue[subkey] = value[subkey];
          }
        });
      }
    }
  },

  // 添加配置对象.
  addConfig: function(obj, filepath) {
    var that = this;
    Object.keys(obj).forEach(function(key) {
      that.set(key, obj[key], filepath);
    });
    return this;
  },

  // 添加本地文件. 允许用户传入处理函数.
  addFile: function(file, handler, isUnshift) {
    file = perfectLocalPath(file);
    var push = isUnshift ? 'unshift' : 'push';
    this._parse();
    this._queue[push](function(callback) {
      var filepath = path.resolve(process.cwd(), file);
      this.addConfig(getConfigObj(fsExt.readFileSync(filepath),
            file, handler), filepath); 
      callback();
    });
    return this;
  },

  // 添加远程配置.
  addUrl: function(url, handler) {
    var that = this;

    this._parse();
    this._queue.push(function(callback) {
      var opts = {
        url: url,
        timeout: 3000
      };

      request(opts, function(err, res, body) {
        if (!err && (res.statusCode < 400)) {
          that.addConfig(getConfigObj(body, url), handler);
        } else {
          throw 'not found config ' + url;
        }
        callback();
      });
    });
    return this;
  },
  
  _parse: function() {
    this._state = 'parsing';         
  },

  _over: function() {
    this._state = 'end';    
  },

  state: function(state) {
    return state ? (this._state = state) : this._state;
  },

  isEnd: function() {
    return this._state === 'end';     
  },

  constructor: Config 
};

Object.keys(EventEmitter.prototype).forEach(function (k) {
  Config.prototype[k] = EventEmitter.prototype[k];
});

// 获取模块配置信息.
function getConfigObj(configCode, config_name, handler) {
  var define = function(__config) {
    return __config;
  };

  var seajs = {
    config: function(__config) {
      return __config;
    }
  };
  
  try {
    configObj = JSON.parse(configCode); 
  } catch(e) {
    if (path.extname(config_name) === '.json') {
      console.error(config_name, e);
      throw 'There has been an error parsing your JSON (' + config_name + ').';
    }
    var semiReg = /;\s+$/g;
    if (semiReg.test(configCode)) {
      configCode = configCode.replace(semiReg, '');
    }
    configObj = eval('(' + configCode + ')');
      // support seajs.config
    if (configObj.alias && !configObj.dependencies) {
      configObj.dependencies = configObj.alias;
      delete configObj.alias;
    }
  }
  return configObj;
}

function clone(obj) {
  var objStr = JSON.stringify(obj);
  return JSON.parse(objStr);
}

function perfectLocalPath(localPath) {
  if (localPath.indexOf('~') === 0) {
    return localPath.replace(/~/, home);
  }
  return localPath;
}
