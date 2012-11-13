 // fileoverview spm install.

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var async = require('async');
var request = require('request');

var ActionFactory = require('../core/action_factory.js');
var ProjectFactory = require('../core/project_factory.js');
var Sources = require('../core/sources.js');
var ConfigParse = require('../core/config_parse.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');
var stringUtils = require('../utils/string.js');
var env = require('../utils/env.js');

var ModuleDownloadQueue = require('./install/module_download_queue.js');

var home = env.home;

var Install = ActionFactory.create('Install');

var FROM_DEFAULT = 'http://modules.seajs.org';

Install.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('install a module to local.');
  opts.usage('spm install [options] name[@version]');
  opts.add('f', 'force', 'override existing files');
  opts.add('from', 'specify the path of modules repository');
  opts.add('to', 'specify the path of modules in local filesystem');
};

var MESSAGE = {

  START: '  Start installing ...',

  NOT_FOUND: "\nError: Cannot find module '%s'\n",

  ALREADY_EXISTS: '\n   ** This module already exists: %s\n' +
      '      Turn on --force option if you want to override it.\n',

  SUCCESS: '  %s has been successfully installed to %s.'
};

var argv;
var DEBUG;

Install.prototype.execute = function(options, callback) {

  var that = this;
  argv = options || this.argv;
  var base = this.base = argv.base || process.cwd();
  DEBUG = argv['with-debug'] || 'debug';

  var to = this.to = this.getTo(base);

  var MDQ = this.MDQ = new ModuleDownloadQueue(DEBUG, to, function() {
    console.info('dependences module download success!');
    console.segm();
    callback();
  });

  callback || (callback = noop);
  var modules = this.modules = options.modules || options.extras;

  var hasDeps;

  // spm install
  if (modules.length === 0) {
    modules = this.getDependencyModules();
    hasDeps = modules.length > 0;

    if (!hasDeps) {
      console.warn('Not found package.json in the current directory!');
      console.info(this.help());
      callback({ errCode: -1 });
      return;
    }
  }

  console.info(MESSAGE.START);

  async.waterfall([

    // 获取SPM数据模型.
    function(callback) {
      var _options = {};
      if (hasDeps) {
        _options.base = base;
      }

      ProjectFactory.getProjectModel(that.name, that.createOptions(_options), function(model) {
        var _to = model.getConfig('to');

        if (_to) {
          to = _to;
          MDQ.setTo(to);
        }

        callback(null, model);
      });
    },

    function(model, callback) {
      MDQ.setSources(model.moduleSources);

      model.getSourceModuleInfo(function(sourceModsInfo) {
         // spm install all
        if (modules[0] === 'all') {
          modules = Object.keys(sourceModsInfo).filter(function(key) {
            return typeof sourceModsInfo[key] !== 'string';
          });
        }

        modules = moduleHelp.unique(modules);

        async.forEachSeries(modules, function(modName, callback) {
          var versions; // 一个模块存在多个版本.
          var modInfo = that.getBasicModInfo(modName);
          var root = modInfo.root;

          if (root) {
            versions = sourceModsInfo[root][modInfo.name];
          } else {
            versions = sourceModsInfo[modInfo.name];
          }

          // 从源中获取模块信息失败
          if (!versions) {
            console.warn('Module ' + modName + ' get error!');
            callback();
            return;
          }

          // 兼容原有的 info.json 格式。
          that.updateModInfo(modInfo, versions.versions || versions);
          modInfo.root = modInfo.root || '';

          ProjectFactory.getProjectModel(that.createOptions({baseModInfo: modInfo}),
            function(model) {
              model.to = to;

              that.install(model, function(err) {
                if (err) {
                  throw new Error(err.errCode);
                }
                console.info(MESSAGE.SUCCESS, stringUtils.capitalize(modInfo.name), to);
                callback();
              });
            }
          );
        }, function(err) {
          callback(err);
        });
      });
    }
  ],

  function(err) {
    if (err) {
      callback(err);
      return;
    }
    if (that.MDQ.queue.length() === 0) {
      callback();
    }
  });
};

Install.prototype.install = function(model, callback) {
  var that = this;
  var files = model.installFiles;

  var files = files.filter(function(f) {
    return !(/^src/.test(f) || new RegExp('-' + DEBUG + '\\.js$').test(f));
  });
  /**
  forEach(function(f) {
     console.info('f1111------->', f, model.getModuleId(f));
     // that.MDQ.parseDeps(model.getModuleId(f), fsExt.readFileSync(path.join(to, f)));
   });
   **/

  var modId = model.getModuleId(files[0]);

  model.getSourceModule(modId, function(err, _modId, filePath) {
    var codeDir = path.dirname(filePath);
    var root = model.root;
    if (root && root === '#') {
      root = '';
    }
    var to = path.join(model.to, root, model.name, model.version);

    // spm install already-exists
    if (fs.existsSync(to) && !argv.force) {
      console.info(MESSAGE.ALREADY_EXISTS, to);
      callback({ errCode: 'ALREADY_EXISTS'});
      return;
    }

    fsExt.mkdirS(to);
    fsExt.copydirSync(codeDir, to);

    files.forEach(function(f) {
      if (!/\.js$/.test(f)) return;

      that.MDQ.parseDeps(model.getModuleId(f), fsExt.readFileSync(path.join(to, f)));
    });
    callback();
  });
};

Install.prototype.getTo = function(base) {
  if (argv.to) {
    return fsExt.perfectLocalPath(argv.to);
  }
  return path.join(base, 'sea-modules');
};

// 根据用户传入的模块名称，获取模块基本信息.
Install.prototype.getBasicModInfo = function(arg) {
  var modInfo = {};
  var parts = arg.split('@');
  var name = parts[0];
  modInfo.version = parts[1];

  modInfo.name = name;

  if (name.indexOf('.') > 0) {
    name = name.split('.');
    modInfo.root = name[0];
    modInfo.name = name.splice(1).join('.');
  }

  modInfo.to = this.to;
  return modInfo;
};

Install.prototype.updateModInfo = function(modInfo, versions, callback) {
  var version = modInfo.version;
  if (!version) {
    // 需要计算最新的版本.
    version = Object.keys(versions).sort(semver.lt)[0];
  }

  modInfo.version = version;
  // such as http://modules.seajs.org/jquery/1.7.1/
  // get files to install
  var files = versions[version];
  if (!files) {
    // 如果此版本的模块没有找到.
    console.info(MESSAGE.NOT_FOUND, modInfo.name + '@' + modInfo.version);
    throw new Error('NOT_FOUND');
  }
  var debugFiles = files.filter(function(f) {
    return /\.js$/.test(f);
  }).map(function(f) {
    return f.replace(/\.js$/, '-debug.js');
  });

  files = files.concat(debugFiles);

  modInfo.installFiles = files;

  if (argv.from) {
    modInfo.sources = [argv.from];
  }
};

Install.prototype.getModsFromConfig = function(packageJsonPath) {
  var jsonObj = eval('(' + fsExt.readFileSync(packageJsonPath) + ')');
  deps = jsonObj.dependencies || {};

  var reservedDeps = ProjectFactory.getReservedDeps(deps);

  ProjectFactory.normalizeDeps(deps);

  var modules = Object.keys(deps).filter(function(key) {
                  return reservedDeps.indexOf(key) < 0;
                }).map(function(key) {
                  return parseModule(deps[key]);
                });

  return modules;
};

function noop() {

}

Install.prototype.getDependencyModules = function() {
  var that = this;
  var packageJsons = []; 
  var basePackageJson = path.join(this.base, 'package.json');

  if (fsExt.existsSync(basePackageJson)) {
    packageJsons.push(basePackageJson);
  }

  if (argv.r) {
    fsExt.listFiles(this.base, /package\.json$/, packageJsons); 
  }

  var modules = [];
  packageJsons.forEach(function(packageJsonPath) {
    var mods = that.getModsFromConfig(packageJsonPath); 
    [].splice.apply(modules, [modules.length, 0].concat(mods));
  });

  return modules;
  // return Object.keys(deps).length;
};

function parseModule(moduleId) {
  var idInfo = Sources.moduleIdParse(moduleId);
  var mod = idInfo.moduleName + '@' + idInfo.version;
  if (idInfo.root && idInfo.root !== '#') {
    mod = idInfo.root + '.' + mod;
  }
  return mod;
}

module.exports = Install;
