'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var zlib = require('zlib');
var async = require('async');
var request = require('request');
var _ = require('underscore');

var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');
var tar = require('../utils/tar.js');
var help = require('../utils/module_help.js');
var ConfigParse = require('../utils/config_parse.js');

var argv = require('../utils/commander').get();

var containVersion = help.containVersion;

var Sources = module.exports = function(project) {
  this.project = project;
  this.sources = project.sources;
  this.sourceDir = path.join(project.globalHome, 'sources');
  initVersionRule(project);
};

// 根据模块id获取模块内容
// TODO 默认如果依赖的是稳定版的模块，只从本地更新，不从服务器更新，强制更新通过--force-update
// TODO 支持本地源
// TODO 对服务源进行缓存，而对本地源则不进行缓存.
Sources.prototype.getModule = function(moduleId, callback) {
  console.log('fetch module ' + moduleId);
  var that = this;

  // 1. 判断模块Id是否是
  // 默认首先更新服务器资源

  async.waterfall([
    function(callback) {
      // 如果无法从服务器获取资源，提出警告，但是继续执行.
      that.getSourceModule(moduleId, callback);
    },

    function(moduleId, moduleFilePath, callback) {
      that.getLocalSourceModule(moduleId, moduleFilePath, callback);
    }
  ], function(err, moduleCode) {
    callback(err, moduleCode);
  });
};


// 尝试从本地源中获取模块.
Sources.prototype.getLocalSourceModule = function(moduleId, moduleFilePath, callback) {

  if (!moduleFilePath) {
    var errMsg = 'Did not find the modules ' + moduleId + ' you need';
    callback(errMsg);
    return;
  }
  callback(null, fsExt.readFileSync(moduleFilePath));
};

// downlaod module.tgz to local.
// 首先检查服务器中是否已经缓存.
Sources.prototype.getSourceModule = function(moduleId, callback) {
  // 1. 根据sources构建出request url.
  // 2. request.head 检查所有的url是否有满足的.
  // 3. 不满足提示错误
  // 4. 下载tgz到对应的本地仓库目录，并触发后续事件.

  var that = this;
  var moduleInfo = moduleIdParse(moduleId, this.project);

  if (!moduleInfo) {
    // 如果请求的模块不合乎规则.
    // var errMsg = 'Illegal module ' + moduleId + '!';
    // console.warn(errMsg);
    callback(null, moduleId, null);
    return;
  }

  var getSourceUrl = function(source, moduleInfo) {
    var _url = url.parse(source + path.sep + path.join(moduleInfo.modulePath,
        moduleInfo.moduleTar)).href;
    return env.normalizePath(_url);
  };

  var requestUrls = this.sources.map(function(source) {

    if (isLocalSource(source)) {
      return path.join(source, moduleInfo.filepath);
    } else {

      // 如果没有强制更新，而且发现模块的版本是稳定版的话
      // 我们就把requestUrl转换为本地url(缓存地址). 但是会检查文件是否存在。
      if (!that.project.getConfig('forceUpdate') && isStableVersion(moduleInfo.version)) {
        var moduleCachePath = that.getModuleFileCachePath(moduleInfo);
        if (fsExt.existsSync(moduleCachePath)) {
          return moduleCachePath;
        }
      }

      return getSourceUrl(source, moduleInfo);
    }
  });

  getValidUrl(requestUrls, function(requestUrl) {
    if (!requestUrl) {

      // 如果没有在服务器发现资源提示警告信息.
      var errMsg = 'find ' + moduleId + ' error!';
      console.error(errMsg);
      callback(null, moduleId, null);
      return;
    }
    console.log('find requestUrl--->', requestUrl);
    if (isLocalSource(requestUrl)) {
      callback(null, moduleId, requestUrl);
    } else {
      var localModulePath = that.getModuleCachePath(moduleInfo);

      fsExt.mkdirS(localModulePath);

      var moduleTarPath = path.join(localModulePath, moduleInfo.moduleTar);
      console.info('Downloading: ' + requestUrl);

      request(requestUrl).pipe(fs.createWriteStream(moduleTarPath)).on('close', function() {
        console.info('Downloaded: ' + requestUrl);

        // 如果发现了模块，下载完成后，就开始进行解压操作.
        that.unpackModuleTar(moduleTarPath, function() {
          callback(null, moduleId, that.getModuleFileCachePath(moduleInfo));
        });
      });
    }
  });
};

Sources.prototype.getModuleFileCachePath = function(moduleInfo) {
  return path.join(this.sourceDir, moduleInfo.filepath);
};

Sources.prototype.getModuleCachePath = function(moduleInfo) {
  return path.join(this.sourceDir, moduleInfo.modulePath);
};


// 获取主源下面模块信息. 如果设置 hasSubInfo, 则会递归获取所有子项目下面的 info 信息.
Sources.prototype.getSourceModuleInfo = function(root, callback, hasSubInfo) {
  if (arguments.length === 1) {
    callback = root;
    root = '';
  }

  var sources = this.project.sources;
  if (!sources) {
    throw new Error('not found sources config!');
  }

  var infoUrls = sources.map(function(source) {
    source = getUrl(source, root);
    return source + 'info.json';
  });

  getValidUrls(infoUrls, function(err, v_infoUrls) {
    if (err) {
      console.warn('没有发现源信息');
      callback(null);
      return;
      // throw new Error(err);
    }

    var infoObjs = [];

    // 分别获取所有有效源的 info.json.
    async.forEachSeries(v_infoUrls, function(infoUrl, cb) {
      loadUrl(infoUrl, function(info) {
        if (!info) {
          cb();
          return;
        }

        async.forEach(Object.keys(info), function(modName, callback) {

          if (hasSubInfo && _.isString(info[modName])) {
            // find sub sources
            var subInfoUrl = getUrl(path.dirname(infoUrl), modName) + 'info.json';
            loadUrl(subInfoUrl, function(subInfo) {
              info[modName] = subInfo;
              callback();
            }, true);
          } else {
            callback();
          }

        }, function(err) {
          if (err) {
            throw new Error('fetch sub sources ' + modName + 'error !');
          }
          infoObjs.push(info);
          cb();
        });
      }, true);
    }, function() {
      // 合并所有源中的 info.json 数据
      var info = {};
      var _info;
      while(_info = infoObjs.shift()) {
        _.defaults(info, _info);
      }

      callback(info);
    });
  });
};

function initVersionRule(project) {
  var versionRule;
  if (project.config && project.config.versionRule) {
    versionRule = project.config.versionRule;
    if (_.isString(versionRule)) {
      versionRule = [new RegExp(versionRule)];
    }

    if (!_.isRegExp(versionRule)) {
      return;
    }

    containVersion = function(str) {
      return help.containVersion(str) || versionRule.test(str);
    };
  }
}

function isStableVersion(version) {
  return !/\-[a-zA-Z]+$/.test(version);
}

function isLocalSource(requestUrl) {
  return requestUrl.indexOf('http') < 0;
}

Sources.prototype.unpackModuleTar = function(moduleTarPath, callback) {

  // 如果存在解压缩，然后继续递归调用.
  console.log('UNPACK ' + moduleTarPath);
  tar.extract(moduleTarPath, path.dirname(moduleTarPath), function(err) {
    if (err) {
      var errMsg = 'Unpack ' + moduleTarPath + 'error!';
      callback(errMsg);
      return;
    }
    var tar = path.basename(moduleTarPath);
    var name = tar.slice(0, tar.indexOf('.tgz'));
    var extractPath = path.join(path.dirname(moduleTarPath), name);

    var extraRes = fsExt.listDirs(extractPath, function(res) {
      return !/dist/.test(res);
    });

    if (extraRes.length) {
      // 资源文件部署到 _extra_resources 目录中。防止冲突.
      // 优先 copy 资源文件，防止覆盖.
      var extraResPath = path.join(extractPath, '..', '_extra_resources');
      extraRes.forEach(function(res) {
        var resPath = path.join(extractPath, res);
        var realPath = path.join(extraResPath, res);
        fsExt.mkdirS(realPath);
        fsExt.copydirSync(resPath, realPath);
      });
    }

    fsExt.copydirSync(path.join(extractPath, 'dist'), path.join(extractPath, '..'));

    // copy package.json
    var packageJson = path.join(extractPath, 'package.json');
    if (fsExt.existsSync(packageJson)) {
      fsExt.copyFileSync(extractPath, path.join(extractPath, '..'), 'package.json');
    }

    // 此处直接删除回报一个IO错误，估计是copy文件和删除文件有点冲突。
    // 估计是nodejs的问题.
    process.nextTick(function() {
      fsExt.rmSync(moduleTarPath);
      fsExt.rmSync(extractPath);
      callback();
    });
  });
};

// 获取所有有效的源服务.
var getValidUrls = Sources.getValidUrls = function(sources, cb) {
  var validUrls = [];
  async.forEach(sources, function(source, cb) {
    getValidUrl(source, function(u) {
      if (u) {
        validUrls.push(u);
      }
      cb();
    });
  }, function() {
    var err = null;
    if (validUrls.length === 0) {
      err = '没有找到合法的网路服务 (' + sources + ').';
    }
    cb(err, validUrls);
  });
};

var getValidUrl = Sources.getValidUrl = function(sources, cb) {
  if (_.isString(sources)) {
    sources = [sources];
  }

  async.detectSeries(sources, function(source, callback) {
    // local sources;
    if (isLocalSource(source)) {
      callback(fsExt.existsSync(source));
      return;
    }

    var options = {
      url: source,
      timeout: argv.timeout
    };
    request.get(options, function(err, res) {
      console.log('HTTP HEAD ' + ((res && res.statusCode) || 'error') + ' ' + source);
      callback(!err && (res.statusCode == 200));
    });

  }, function(source) {
    cb(source);
  });
};

// 根据moduleId返回模块信息
var moduleIdParse = Sources.moduleIdParse = function(moduleId) {
 
  // 如果请求的模块 ID 不符合要求，则返回null.
  if (!containVersion(moduleId)) {
    return null;
  }

  if (moduleId.indexOf('#') === 0) {
      moduleId = moduleId.slice(1);
  }

  var filepath = getSourceFilePath(moduleId);
  var modulePath = moduleId;

  while (containVersion(path.dirname(modulePath))) {
    modulePath = path.dirname(modulePath);
  }

  var version = path.basename(modulePath);
  var moduleRelaPath = path.dirname(modulePath);
  var moduleName = path.basename(path.join(modulePath, '..'));
  var moduleTar = moduleName + '.tgz';
  var root = path.dirname(moduleRelaPath);
  if (root === '.') root = '';

  return {
    root: root,
    moduleId: moduleId,
    moduleName: moduleName,
    filepath: filepath,
    moduleTar: moduleTar,
    version: version,
    modulePath: modulePath
  };
};

Sources.InfoMapping = {};

var loadUrl = Sources.loadUrl = function(_url, callback, isJson) {
  var info = Sources.InfoMapping[_url];
  if (info) {
    if (isJson) {
      info = JSON.parse(info);
    }
    callback(info);
    return;
  }

  var opt = {
    url: _url,
    timeout: argv.timeout
  };

  console.log('Downloading: ' + opt.url);
  request(opt, function(err, res, body) {
    console.log('Downloaded: ' + opt.url);

    if (!err && (res.statusCode < 400)) {
      Sources.InfoMapping[_url] = body;
      if (isJson) {
        try {
          body = JSON.parse(body);
        } catch(e) {
          body = {};
        }
      }
      callback(body);
    } else {
      console.warn(_url, err);
      callback(null);
    }
  });
};

// 获取文件在源中的路径.
function getSourceFilePath(moduleId) {
  var filename = help.getJsFileNameById(moduleId);
  return path.join(path.dirname(moduleId), filename);
}


function getUrl(baseUrl) {
  baseUrl.replace(/\/$/, '');
  var args = [].slice.call(arguments, 1);

  args.forEach(function(arg) {
    if (!arg) return;
    baseUrl = baseUrl + '/' + arg;
  });

  return fsExt.normalizeEndSlash(baseUrl);
}
