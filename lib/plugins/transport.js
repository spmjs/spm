
// 检查模块代码中是否包含 transport 文件，并对对应的文件进行处理。

var path = require('path');
var async = require('async');
var request = require('request');
var _ = require('underscore');

var Plugin = require('../core/plugin.js');
var Sources = require('../core/sources.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var StringUtil = require('../utils/string.js');

var plugin = module.exports = Plugin.create('transport');

plugin.run = function(project, callback) {
  var that = this;
  var build = project.buildDirectory;
  var debug = project.debugName;
  var codes = {};

  // 检查 srcUrl, minUrl 然后进行拆分成不同的 transport

  var scripts = fsExt.listFiles(build, /\.transport$/).forEach(function(f) {
    var code = fsExt.readFileSync(f);
    var modName = path.relative(build, f);
    codes[getBaseName(modName)] = code;
    fsExt.rmSync(f);
  });

  _.keys(codes).forEach(function(modName){
    preCompile(modName, codes, debug); 
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

var includeReg = /\/\/\s*@(include|minUrl|srcUrl)\s*(.+)/g;
plugin.compile = function(project, code, cb) {
  var includes = [];
  var codes = {};
  code.replace(includeReg, function(match, type, include) {
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
    code = code.replace(includeReg, function(match, type, include) {
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

// 检查 minUrl, srcUrl, include 然后重整 transport 文件.
// 1. 如果只存在minUrl，copy 一份 debug 代码
// 2. 如果同时存在 srcUrl, minUrl 需要产生一份 debug 代码，并 copy 一份 debug 代码。其中需要 debug代码中的
// include为 @srcUrl
function preCompile(modName, codes, debug) {
  var includes = {};
  var code = codes[modName];
  code.replace(includeReg, function(match, include, url) {
    includes[include] = url;
  });

  var includeTypes = _.keys(includes);

  // 仅存在压缩模块，copy debug 模块.
  if (includeTypes.length === 1 && includeTypes[0] === 'minUrl') {
    codes[modName + '-' + debug] = code;
  }

  // 如果同时包含源文件和压缩代码.
  if (includeTypes.indexOf('srcUrl') > -1 &&
      includeTypes.indexOf('minUrl') > -1) {

    codes[modName] = delInclude(code, 'srcUrl');
    codes[modName + '-' + debug] = delInclude(code, 'minUrl');
  }
}

function delInclude(code, includeType) {
  code = code.replace(includeReg, function(match, type) {
    if (type === includeType) {
      return '';
    } else {
      return match;
    }
  });
  return code;
}

