'use strict';

var path = require('path');
var url = require('url');
var semver = require('semver');

var fsExt = require('./fs_ext.js');
var StringUtil = require('./string.js');
var Ast = require('./ast.js');
var DepUtil = require('./dependences.js');
var env = require('./env.js');

var home = env.home;

// 对与这些模块我们不会自动添加后缀 .js
var FILE_EXT_RE = /\.(?:css|less|tpl|html|htm|swf|jpg|jpeg|json)$/;

// 这些模块是不需要添加 -debug 信息的.
// TODO 后续看看能有一种方式注入新的类型.
var isResourceMod = exports.isResourceMod = function(value) {
  return FILE_EXT_RE.test(value);
}

var isJs = exports.isJs = function(filepath) {
  return /\.js#?$/.test(filepath);
};

var isCss = exports.isCss = function(filepath) {
  return /\.css#?$/.test(filepath);
};

var isTpl = exports.isTpl = function(filepath) {
  return /\.(?:tpl|htm|html)$/.test(filepath);
};

exports.isCoffee = function(filepath) {
  return  /\.coffee$/.test(filepath);
};

exports.isJson = function(filepath) {
  return  /\.json$/.test(filepath);
};

exports.isUrl = function(filepath) {
  return /^https?:\/\//.test(filepath);
};

// 检查模块是否是变量模板
var VARS_RE = /\{\{([^{}]+)\}\}/;
exports.isVarsModule = function(modName) {
  return VARS_RE.test(modName);
};

// 如果用户配置 base, 那么会额外的检查本地是否存在此模块。
exports.isRelative = function(id, base) {
  var relative = id.indexOf('./') === 0 || id.indexOf('../') === 0;

  if (!relative && base) {
    relative = fsExt.existsSync(path.join(base, id));
  }

  return relative;
};

// 规整内部依赖模块
// ./module/p.js ==> ./plugin/p.js
// ./module ==> ./module.js
exports.normalize = function(module, ext) {
  module = exports._normalizeMod(module, ext);
  return env.normalizePath(module);
};

exports.normalizeRelativeMod = function(module, ext) {

  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }

  module = exports._normalizeMod(module, ext);
  return env.normalizePath(module);
};

// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
exports._normalizeMod = function(module, ext) {

  // 只处理相对模块。
  if (!exports.isRelative(module)) return module;
  module = path.normalize(module);

  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }

  ext = ext || 'js';

  var modExt = path.extname(module);

  if (/#$/.test(modExt)) {
    return module.slice(0, -1);
  }

  // fix https://github.com/seajs/spm/issues/312
  if (!isResourceMod(modExt) && !isJs(module)) {
    module += ('.' + ext);
  }

  return module;
};

exports.unique = function(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
};

exports.isLocalPath = function(requestUrl) {
  if (requestUrl.indexOf('~') === 0) return true;
  if (exports.isUrl(requestUrl)) return false;

  if (fsExt.existsSync(requestUrl)) {
    return true;
  }
  return false;
};

exports.perfectSource = function(source) {
  if (source.indexOf('http') !== 0) {
    source = 'http://' + source;
  }
  return source;
};

exports.perfectLocalPath = function(localPath, base) {
  if (typeof localPath !== 'string') {
    localPath = localPath + '';
  }

  if (localPath.indexOf('~') === 0) {
    return localPath.replace(/~/, home);
  }

  if (env.isAbsolute(localPath)) {
    return localPath;
  }

  base = base || process.cwd();

  if(fsExt.existsSync(path.join(base, localPath))) {
    return path.join(base, localPath);
  } else {
    return localPath;
  }
};

exports.getHost = function(requestUrl) {
  if (requestUrl.indexOf('http') < 0) {
    requestUrl = 'http://' + requestUrl;
  }
  var h = url.parse(requestUrl).host;
  return h.replace(/:/, '-');
};

// 根据基于base的main模块路径，计算出他以来的dep模块相对于base的完整path路径.
exports.getBaseDepModulePath = function(main, dep) {
  if (main == dep) {
    return main;
  }
  return './' + env.normalizePath(path.join(path.dirname(main), dep));
};

// 根据两个相对于base的模块，计算出这两个模块的依赖关系.
// lib/a.js, core/b.js ==> ../core/b.js;
exports.getRelativeBaseModulePath = function(base, module) {
  var module = env.normalizePath(path.relative(path.dirname(base), module));
  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }
  return module;
};

// 获取模块名，可以指定是否是 debug 模块.
exports.getBaseModule = function(moduleName) {
  moduleName = exports.normalize(moduleName);
  var ext = path.extname(moduleName);

  // 只有 js 模块，才需要去除后缀信息。
  if (isJs(moduleName)) {
    moduleName = moduleName.slice(0,
        moduleName.lastIndexOf(ext));
  }
  return moduleName;
};

exports.getDebugModule = function(moduleName, debug) {
  var ext = path.extname(moduleName);
  debug = debug || '';

  // 只有 js 和 css 模块，才需要添加 DEBUG 信息。
  if (isJs(moduleName) || isCss(moduleName)) {
    moduleName = moduleName.slice(0,
        moduleName.lastIndexOf(ext)) + debug + ext;
  } else if (!isResourceMod(moduleName)) {
    // 默认全部都是 js 模块，直接添加后缀.
    moduleName = moduleName + debug;
  }

  return moduleName;
};

var versionReg = /^[v=]*\s*([0-9]+)\.([0-9]+)\.([0-9]+)(-[0-9]+-?)?([a-zA-Z-][a-zA-Z0-9-.:]*)?\s*$/;
var containVersionReg = /[v=]*\s*([0-9]+)\.([0-9]+)\.([0-9]+)(-[0-9]+-?)?([a-zA-Z-][a-zA-Z0-9-.:]*)?\s*/;

var isVersion = exports.isVersion = function(id) {
  return versionReg.test(id);
};

var containVersion = exports.containVersion = function(str) {
  return containVersionReg.test(str);
};

// 计算最新的版本.
var getLatestVersion = exports.getLatestVersion = function(versions) {
  return Object.keys(versions).sort(semver.lt)[0];
};

// 根据moduleId返回模块信息
exports.moduleIdParse = function(moduleId) {

  // 如果请求的模块 ID 不符合要求，则返回null.
  if (!containVersion(moduleId)) {
    return null;
  }

  if (moduleId.indexOf('#') === 0) {
      moduleId = moduleId.slice(1);
  }

  var modulePath = moduleId;
  while (containVersion(path.dirname(modulePath))) {
    modulePath = path.dirname(modulePath);
  }

  var version = path.basename(modulePath);
  var moduleRelaPath = path.dirname(modulePath);
  var moduleName = path.basename(path.join(modulePath, '..'));

  return {
    moduleId: moduleId,
    moduleName: moduleName,
    version: version
  };
};

var defaultIdRule = '{{root}}/{{name}}/{{version}}/{{moduleName}}';

var generateModuleId = exports.generateModuleId = function(rule, obj) {
  if (arguments.length === 1) {
    obj = rule;
    rule = defaultIdRule;
  }

  rule = rule || defaultIdRule;

  var modId = StringUtil.tmpl(rule, obj);
  modId = modId.replace(/\/\//g, '/');

  if (obj.root === '#' || obj.root === '') {
    modId = modId.replace(/^#?\//, obj.root);
  }
  return env.normalizePath(modId);
};

// 是否是没有标准化过的模块, define(function(){});
// 是否是已经编译过的 cmd 模块 define('id', [], function(){}); isOriMod=true
exports.hasDefine = function(code, isOriMod) {
  return DepUtil.hasDefine(code, isOriMod);
};

exports.filterIdAndDeps = function(code, moduleId, deps) {
  return Ast.replaceDefine(code, moduleId, deps);
};

function getDepStr(depList) {
  return depList.length ? '"' + depList.join('", "') + '"' : '';
}


// 对代码文件中依赖的模块，进行替换. 主要是增加debug
exports.filterRequire = function(project, code, debug) {
  return Ast.replaceRequireValue(code, function(value) {
    if (!isResourceMod(value)) {
      if (exports.isRelative(value)) {
        return exports.getDebugModule(value, debug);
      } else {
        return project.getGlobalModuleId(value) + debug;
      }
    } else {
      return value;
    }
  });
};

/**
 * baseModule: plugins/p1.js
 * depModule: ../a.js
 * ===> ./a.js
 * baseModule: p).js
 * depModule: ./plugins/p1.js
 * ===> ./plugins/p1.js
 * baseModule: p1.js
 * depModule: ./a.js
 * ===> ./a.js;
 */
exports.getDepModule = function(baseModule, depModule) {
  var module = path.join(path.dirname(baseModule), depModule);
  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }
  return exports.normalize(module);
};

exports.globMods = function(mods, directory) {
  mods = mods || [];
  var _mods = [];
  mods.forEach(function(mod) {
    if (exports.isRelative(mod)) {
      if (/\*/.test(mod)) {
        var _tempMods = fsExt.globFiles(mod, directory, true);
        [].splice.apply(_mods, [_tempMods.length, 0].concat(_tempMods));
      } else {
        _mods.push(mod);
      }
    } else {
      _mods.push(mod);
    }
  });
  return _mods;
};

// 根据ModuleId 获取模块文件名
exports.getJsFileNameById = function(moduleId) {
  var filename = path.basename(moduleId);
  if (!isResourceMod(path.extname(filename)) && !isJs(filename)) {
    filename += '.js';
  }
  return filename;
};

// 如果模块的名称包含 ! 那么说明此模块是主模块的附属模块，此模块讲不会被传递依赖。
exports.isAffiliatedMod = function(moduleId) {
  return moduleId.indexOf('!') > 0;
};
