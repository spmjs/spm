// 负责收集插件的argv注册到全局argv中。

var Opt = require('optimist');
var _opts = {};
var DEFAULT = '_default';

function Opts(name, message) {
  this.name = name;
  this._id = name + '_' + parseInt(Math.random() * 1000);
  this.message = message;
  this.usageMsg = 'spm ' + name + ' [options]';
  this.parentOpt = null;

  // 收集信息，以便子类进行使用.
  this.options = {};
  this.opt = null;
}

Opts.prototype = {

  add: function(key, alias, message) {
    var args = [].slice.call(arguments, 0);
    var prefixMessage = '';
    if (args.length === 1) {
      throw '(argv.js)register argv error!(' + argv.join(' ') + ')';
    }

    if (args.length === 2) {
      message = alias;
      alias = key;
      key = null;
    }

    var _option = this.options[alias] || (this.options[alias] = {});
    if (Object.keys(_option).length) {
      console.warn('Repeat set ' + alias + '!');
      return this;
    }

    if (key) {
      _option['alias'] = key;
    }

    _option['description'] = message;
    this.options[alias] = _option;
    return this;
  },

  defaultValue: function(key, value) {
    this.options[key]['default'] = value;
    return this;
  },

  // fix the args specified type.
  type: function(key, type) {
    var types = ['string', 'boolean'];
    if (types.indexOf(type) > -1) {
      this.options[key]['type'] = type;
    }
  },

  extend: function(parentOpt) {
    var _parentOpt = this.parentOpt;
    this.parentOpt = parentOpt;
    parentOpt.parentOpt = _parentOpt;
  },

  get argv() {
    var options = clone(this.options);
    var _opt = this.parentOpt || exports.get(DEFAULT);
    var isAddDefault = false;

    while (_opt && !isAddDefault) {
      Object.keys(_opt.options).forEach(function(alias) {
        options[alias] = _opt.options[alias];
      });

      if (_opt.name == DEFAULT) {
        isAddDefault = true;
      }

      _opt = _opt.parentOpt;

      if (_opt == null) {
        _opt = exports.get(DEFAULT);
      }
    }

    var opt = this.opt = Opt(process.argv);
    opt.options(options);
    opt.usage(this.message + '\nusage: ' + this.usage());
    return opt.argv;
  },

  help: function(message) {
    if (message) {
      this.message = message;
    } else {
      // 重新计算帮助信息.
      var _argv = this.argv;
      return this.opt.help();
    }
  },

  usage: function(msg) {
    if (msg) {
      this.usageMsg = msg;
    } else {
      return this.usageMsg;
    }
  }
};

exports.get = function(key, help) {
  key = (key || DEFAULT).toLowerCase();
  return _opts[key] || (_opts[key] = new Opts(key, help || ''));
};

function clone (obj) {
  var objStr = JSON.stringify(obj);
  return JSON.parse(objStr);
}
