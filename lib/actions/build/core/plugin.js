
var argv = require('optimist').argv;

function Plugin(name) {
  this._params = {};
  this.name = name;
}

Plugin.prototype.execute = function(project, callback) {
  var that = this;
  this.project = project;
  this._config = project.plugins[this.name] || {};
  this._initParams();
  this.enter();
  this.run(function() {
    that.end();
    callback();
  });
};

Plugin.prototype.run = function(callback) {
  console.warn('Please implement your own "run()".');
  callback();
};

Plugin.prototype._initParams = function() {
  var that = this;
  Object.keys(this._params).forEach(function(name) {
    that._param(name, that._params[name]);
  });
};

Plugin.prototype.enter = function() {
  console.log('--- SPM ' + this.name.toUpperCase() + ' DEPENDENCIES PLUGIN ---')
  console.empty();
};

Plugin.prototype.end = function() {
  console.info('SPM ' + this.name + ' plugin execution successfully!');
  console.empty();
};


// 注册参数，其中参数的值可以通过命令行和配置文件进行改变。
// 也允许用户定义默认值.
// 其中插件配置的参数不允许使用短命名。
Plugin.prototype._param = function(name, value) {
  this[name] = this._config[name] || argv[name] || value || null;
};

Plugin.prototype.param = function(name, value) {
  this._params[name] = value;
};

module.exports.create = function(name) {
  return new Plugin(name);
};

