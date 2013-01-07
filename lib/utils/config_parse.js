// 负责配置文件解析，并返回一个Config对象.

// 配置文件读取:
//   1. 支持远程文件读取(source/config.json).
//   2. 支持本地文件读取(../config.json).
//   3. 读取顺序保证，只有前面一个解析完毕后才能读取下一个.
//   4. 在解析过程中允许动态添加配置模块.
//   5. 支持非规则文件解析, 根据用户后缀进行确定.
//   6. 可以在解析完成后，也可以继续添加配置文件解析.

// 读取顺序(暂不考虑命令行参数, 具体的顺序由使用者来决定).
//   1. project_config.json
//   2. parent_config.json(如果有的话)
//   3. source_config.json(源配置, sources/config.json)
//   4. golbal_config.json(用户传入)
//   5. spm_config.json(系统配置文件)
//
//   // 目前对于parent_config的解析，需要用户传入对应的处理规则来进行处理.

// 内容合并规则的处理:
//   对象: 不同内容合并，相同内容不覆盖.
//   数组: 内容相同，提升优先级，不同插入到对尾)
//   自定义解析: 支持用户针对某个属性的内容传入自定义解析规则，比如excludes

// 内容获取:
//   当对象获取时，还处在解析状态中，报错。
//   是否支持异步数据获取呢？

var path = require('path');
var URL = require('url');
var request = require('request');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var moduleHelp = require('../utils/module_help.js');
var argv = require('./commander.js').get();
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
        callback: _.isFunction(callback) ? callback : null
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

    // 支持同步请求，但是同步请求必须自己确定整个对象已经解析完成.
    if ((this._state !== 'end') && !fn) {
      throw new Error('the config is parsing');
    }

    if (arguments.length === 0) {
      return this._obj;
    }

    if (fn) {
      if (!this.isEnd()) {
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

  removeParseRule: function(key) {
    delete this._parseRule[key];
  },

  set: function(key, value, filepath) {
    var rule = this._parseRule[key] || null;
    if (rule) {
      // 交由用户的parseRule来处理.
      rule.call(this, value, filepath);
    } else {
      this.setValue(key, value);
    }
  },

  setValue: function(key, value) {
    var obj = this._obj;
    var baseValue = obj[key];

    if (_.isUndefined(baseValue)) {
      obj[key] = clone(value);
      return;
    }

    // 数组合并.
    if (Array.isArray(baseValue)) {
      if (!Array.isArray(value)) {
        value = [value];
      }
      obj[key] = _.union(baseValue, value);
      return;
    }

    // 对象合并
    if (_.isObject(baseValue) && _.isObject(value)) {
      merge(baseValue, value);
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
  addFile: function(file, basepath, isUnshift) {
    if (basepath) {
      file = path.join(basepath, file);
    }

    file = perfectLocalPath(file);
    var push = isUnshift ? 'unshift' : 'push';

    if (this._queue.length() === 0) {
      push = 'push';
    }

    this._parse();
    this._queue[push](function(callback) {
      var filepath = path.resolve(process.cwd(), file);
      this.addConfig(getConfigObj(fsExt.readFileSync(filepath), file), filepath);
      callback();
    });
    return this;
  },

  // 添加远程配置.
  addUrl: function(url, baseurl, isUnshift) {
    var that = this;

    if (baseurl) {
      url = URL.resolve(baseurl, url);
    }
    this._parse();
    var push = isUnshift ? 'unshift' : 'push';
    if (this._queue.length() === 0) {
      push = 'push';
    }

    this._queue[push](function(callback) {
      var opt = {
        url: url,
        timeout: argv.timeout
      };
      console.info('Downloading: ' + opt.url);

      request(opt, function(err, res, body) {
        if (!err && (res.statusCode < 400)) {
          console.info('Downloaded: ' + opt.url);
          that.addConfig(getConfigObj(body, url), baseurl);
        } else {
          throw new Error('not found config ' + url);
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

  bind: function(event_name, cb) {
    if (this.isEnd()) {
      cb();
    } else {
      this.once(event_name, cb);
    }
  },

  constructor: Config
};

Object.keys(EventEmitter.prototype).forEach(function(k) {
  Config.prototype[k] = EventEmitter.prototype[k];
});

// 获取模块配置信息.
function getConfigObj(configCode, config_name) {
  var define = function(__config) {
    return __config;
  };

  var seajs = {
    config: function(__config) {
      return __config;
    }
  };

  var configObj;
  try {
    configObj = JSON.parse(configCode);
  } catch (e) {
    if (path.extname(config_name) === '.json') {
      console.error(config_name, e);
      throw new Error('There has been an error parsing your JSON (' + config_name + ')');
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

var merge = module.exports.merge = function(base, val, key) {

  if (!key) {
    Object.keys(val).forEach(function(subkey) {
      merge(base, val, subkey);
    });
    return;
  }
  var v1 = base[key];
  var v2 = val[key];

  if (_.isUndefined(v1) || _.isNull(v1)) {
    base[key] = v2;
    return;
  }

  // 数组合并.
  if (_.isArray(v1)) {
    if (!_.isArray(v2)) {
      v2 = [v2];
    }
    base[key] = _.union(v1, v2);
    return;
  }
  if (!_.isObject(v1) || !_.isObject(v2)) {
    return;
  }

  Object.keys(v2).forEach(function(subkey) {
    merge(v1, v2, subkey);
  });
};
