
// 检查模块代码中是否包含 transport 文件，并对对应的文件进行处理。

var path = require('path');
var async = require('async');
var request = require('request');

var Plugin = require('../core/plugin.js');
var Sources = require('../core/sources.js');
var fsExt = require('../utils/fs_ext.js');
var StringUtil = require('../utils/string.js');

var plugin = module.exports = Plugin.create('transport');
var argv;

plugin.run = function(project, callback) {
  argv = this.argv;
  var that = this;
  var build = project.buildDirectory;
  var codes = {};

  var scripts = fsExt.listFiles(build, /\.transport$/).forEach(function(f) {
    var code = fsExt.readFileSync(f);
    var modName = path.relative(build, f);
    codes[getBaseName(modName)] = code;
    fsExt.rmSync(f);
  });

  async.forEach(Object.keys(codes), function(modName, cb) {
    var code = codes[modName];
    that.compile(project, code, function(code) {
      fsExt.writeFileSync(path.join(build, modName + '.js'), code);
      cb();
    });
  }, function() {
    callback();
  });
};

var includeReg = /\/\/\s*@include\s*(.+)/g;
plugin.compile = function(project, code, cb) {
  var includes = [];
  var codes = {};
  code.replace(includeReg, function(match, include) {
    include = perfectInclude(include, project);
    includes.push(include.trim());
  });

  if (includes === 0) {
    cb();
    return;
  }

  async.forEach(includes, function(include, cb) {

    if (include.indexOf('http') > -1) {

      Sources.loadUrl(include, function(code) {
        codes[include] = code;
        cb();
      });
    } else if (moduleHelp.isLocalPath(include)) {

      include = moduleHelp.perfectLocalPath(include);
      codes[include] = fsExt.raadFileSync(include);
      cb();
    } else {

      codes[include] = include;
      console.warn('Unable transport ' + include);
      cb();
    }
  }, function() {
    code = code.replace(includeReg, function(match, include) {
      include = perfectInclude(include, project);
      return codes[include];
    });
    cb(code);
  });
};

function perfectInclude(include, model) {
  include = include.trim();
  return StringUtil.tmpl(include, model);
}

function getBaseName(name) {
  var ext = path.extname(name);
  if (ext) {
    name = name.slice(0, name.lastIndexOf(ext));
  }
  return name;
}
