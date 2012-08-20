// 负责收集插件的argv注册到全局argv中。

var _opts = {};
var DEFAULT = '_default';
function Opts(name, help) {
  this._id = process.getuid || process.getuid() || 1;
  this.name = name;
  this.message = help;
  this.usages = [];
  this.parentOpt = null;
  this.opt = require('optimist').usage(this.usages.join());
}

Opts.prototype = {
   
  add: function(key, alias, help) {
    var args = [].slice.call(arguments, 0);
    var prefixHelp = '';
    if (args.length === 1) {
      throw '(argv.js)register argv error!(' + argv.join(' ') + ')';
    }

    if (args.length === 2) {
      help = alias;
      alias = key;
      key = null;
    }

    if (key) {
      this.opt.alias(key, alias);
      prefixHelp = '-' + key + ', ';
    }
    prefixHelp = prefixHelp + '--' + alias; 
    help = prefixHelp + ' [' + help + ']';
    this.usages.push(help);
    return this;
  },

  defaultValue: function(key, value) {
    this.opt['default'](key, value);
    return this;
  },
  
  extend: function(parentOpt) {
    this.parentOpt = parentOpt;    
  },

  get argv() {
    var _opt = this.parentOpt;
    var usages = this.usages.slice(0);
    while(_opt) {
      usages.splice(0, 0, _opt.usages);
      _opt = _opt.parentOpt;
    }
    if (this.name !== DEFAULT) {
      usages.splice(0, 0, _opts[DEFAULT].usages);
    }
    usages.unshift(this.message);
    this.opt.usage(usages.join('\n  '));
    return this.opt.argv;
  },

  help: function() {
    var _argv = this.argv;
    return this.opt.help();      
  }

};

exports.get = function(key, help) {
  key = (key || DEFAULT).toLowerCase();
  var _opt = _opts[key] || (_opts[key] = new Opts(key, help || ''));
  _opt.message = _opt.message || help || '';
  return _opt;
};


