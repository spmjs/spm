// TODO 插件需要申明自己是否需要项目模型.
function Plugin(name) {
  this._params = {};
  this.name = name;
  this.options = {};
}

Plugin.prototype.execute = function(project, callback) {
  var that = this;
  this.project = project;
  this._config = (project.plugins && project.plugins[this.name]) || {};
  this._initParams();
  this.enter();
  this.run(function(err) {
    if (err) {
      console.error(err);
    } else {
      that.end();
      callback();
    }
  });
};

Plugin.prototype.run = function(callback) {
  console.log('Please implement your own "run()".');
  callback();
};

Plugin.prototype.setOpts = function(opts) {
  this.opts = opts;
  this.setArgv();
};

Plugin.prototype.setArgv = function() {
  this.argv = this.opts.argv;
};

Plugin.prototype._initParams = function() {
  var that = this;
  var project = this.project;
  Object.keys(this._params).forEach(function(name) {
    var value = that._params[name];
    that._param(name, that.replace(value, project));
  });
};

// 查找占位符，并替换成对应的变量。
var placeHolderReg = /(?:%(\w+)%)/gm;
Plugin.prototype.replace = function(value, data) {
  if (typeof value !== 'string') return value;

  return value.replace(placeHolderReg, function(match, param) {
      var value;

      if (typeof data === 'function') {
        value = data(param);
      } else {
        value = data[param];
      }

      if (!value) {
        console.warn('find out of place placeholder!-->' + match);
        return match;
      }
      return value;
    });
};

Plugin.prototype.enter = function() {
  console.log('--- SPM PLUGIN ' + this.name.toUpperCase() + ' ---');
};

Plugin.prototype.end = function() {
  console.log('SPM PLUGIN ' + this.name.toUpperCase() + ' EXECUTION SUCCESS!');
  //console.empty();
};


// 1. 注册参数，其中参数的值可以通过命令行和配置文件进行改变。
// 2. 允许用户定义默认值。
// 3. 其中插件配置的参数不允许使用短命名。
// TODO 插件中不允许出现在系统中截取的参数名。
// TODO 所有的插件是不是不允许直接从argv中获取内容，应该通过包装后的
//      project对象进行获取.
Plugin.prototype._param = function(name, value) {
  var argv = this.argv;
  var _value;

  if (typeof this._config[name] === 'boolean') {
    _value = this._config[name];
  } else if (argv[name] === 'false' || argv[name] === 'true') {
    _value = (argv[name] === 'true');
  } else if (typeof value === 'boolean') {
    _value = value;
  } else {
    _value = this._config[name] || argv[name] || value || null;
  }

  this[name] = _value;
};

Plugin.prototype.param = function(name, value, desc) {
  this._params[name] = value;
  if (desc) {
    this.options[name] = {
      value: value,
      desc: desc || '' 
    };
  }
};

// 注册参数,方便提示.
Plugin.prototype.registerArgs = function() {
  var opts = opts || this.opts;
  var options = this.options;
  Object.keys(options).forEach(function(key) {
    opts.add(key, options[key].desc) 
    opts.defaultValue(key, options[key].value);
  });
};
// TODO 插件中不允许出现在系统中截取的参数名.
//

module.exports.create = function(name, run) {
  var plugin = new Plugin(name);
     
  if (run) plugin.run = run;
  return plugin;
};
