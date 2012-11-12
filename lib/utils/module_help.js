var path = require('path');
var url = require('url');
var semver = require('semver');

var fsExt = require('./fs_ext.js');
var StringUtil = require('./string.js');
var env = require('./env.js');
var home = env.home;

var FILE_EXT_RE = /\.(?:js|css|tpl|less|coffee)$/;

exports.isJs = function(filepath) {
  return path.extname(filepath) === '.js';
};

exports.isCss = function(filepath) {
  return path.extname(filepath) === '.css';
};

exports.isRelative = function(id) {
  return id.indexOf('./') === 0 ||
         id.indexOf('../') === 0 ||
         FILE_EXT_RE.test(id);
};

// 规整内部依赖模块
// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
exports.normalize = function(module, ext) {
  module = exports.normalizeModule(module, ext)
  return env.normalizePath(module);
};

// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
exports.normalizeModule = function(module, ext) {
  module = path.normalize(module);
  ext = ext || 'js';

  // fix https://github.com/seajs/spm/issues/312
  if (!FILE_EXT_RE.test(path.extname(module))) {
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
  if (requestUrl.indexOf('http') > -1) return false;
  if (fsExt.existsSync(requestUrl)) {
    return true;
  }
  return false;
};

exports.perfectLocalPath = function(localPath) {
  if (typeof localPath !== 'string') {
    localPath = localPath + '';
  }

  if (localPath.indexOf('~') === 0) {
    return localPath.replace(/~/, home);
  }

  if (env.isAbsolute(localPath)) {
    return localPath;
  }

  return path.join(process.cwd(), localPath);
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

// 获取模块名，主要是去除后缀.
exports.getBaseModule = function(moduleName) {
  var ext = path.extname(moduleName);
  if (ext) {
    moduleName = moduleName.slice(0,
        moduleName.lastIndexOf(ext));
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

exports.filterIdAndDeps = function(code, moduleId, deps) {
  var defineReg = /define\s*\(\s*(function|{)/;
  code = code.replace(defineReg, function(match, mtype) {
    return 'define("' + moduleId + '", [' + getDepStr(deps) + '], ' + mtype;
  });
  return code;
};

function getDepStr(depList) {
  return depList.length ? '"' + depList.join('", "') + '"' : '';
}

// 对代码文件中依赖的模块，进行替换. 主要是增加debug
exports.filterRequire = function(project, code, debug) {
  var modPattern = project.getReqModRegByType('[^\"\']+');
  var asyncModRegCheck = project.getAsyncReqModRegByType('[^\"\']+', false);
  var asyncModReg = project.getAsyncReqModRegByType('[^\"\']+');

  if (asyncModRegCheck.test(code)) {
    code = code.replace(asyncModReg, function(match, sep, mark, depModName) {
      return getRequireByMatch(project, debug, match, sep, mark, depModName, 'require.async');
    });
  }

  return code.replace(modPattern, function(match, sep, mark, depModName) {
    return getRequireByMatch(project, debug, match, sep, mark, depModName, 'require');
  });
}

function getRequireByMatch(project, debug, match, sep, mark, depModName, req) {
  if (/(\.css|\.tpl|\.coffee|\.less)$/.test(depModName)) {
    return match;
  }

  if (exports.isRelative(depModName)) {
    depModName = exports.getBaseModule(depModName);
    return sep + req + "('" + depModName + debug + "')";
  }

  var globalModuleId = project.getGlobalModuleId(depModName);
  return sep + req + "('" + globalModuleId + debug + "')";
}

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
  return exports.normalize(path.join(path.dirname(baseModule), depModule));
}
