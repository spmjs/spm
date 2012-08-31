 // fileoverview spm install.

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var async = require('async');
var request = require('request');

var ActionFactory = require('../core/action_factory.js');
var ProjectFactory = require('../core/project_factory.js');
var ConfigParse = require('../core/config_parse.js');
var fsExt = require('../utils/fs_ext.js');
var env = require('../utils/env.js');

var home = env.home;

var Install = ActionFactory.create('Install');

var FROM_DEFAULT = 'http://modules.seajs.org';

Install.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('install a module.\nusage: spm install [options] name[@version]');
  opts.add('f', 'force', 'override existing files');
  opts.add('from', 'specify the path of modules repository');
  opts.add('to',  'specify the path of modules in local filesystem');
};

var MESSAGE = {

  START: '  Start installing ...',

  NOT_FOUND: "\nError: Cannot find module '%s'\n",

  ALREADY_EXISTS: '\n   ** This module already exists: %s\n' +
      '      Turn on --force option if you want to override it.\n',

  SUCCESS: '  Installed to %s/%s/'
};

var argv;

Install.prototype.run = function(callback) {
  var that = this;

  var sourceConfig = new ConfigParse();
  var opts = this.opts;
  argv = opts.argv;
  callback || (callback = noop);
  var modules = this.modules = argv._.slice(3);

  // spm install
  if (modules.length === 0) {
    console.info(opts.help());
    callback({ errCode: -1 });
    return;
  }

  console.info(MESSAGE.START);

  var from = this.from = this.getFrom();
  
  var to = this.to = this.getTo();

  // spm install all
  if (modules[0] === 'all') {
    modules = Object.keys(info).filter(function(key) {
      return key !== 'root';
    });
  }

  sourceConfig.addUrl(from + 'info.json'); 
  sourceConfig.once('end', function(sourceConfig) {
    async.forEach(modules, function(modName, callback) {
      var modInfo = that.getBasicModInfo(modName);

      var infos = sourceConfig.get(modInfo.name);
      var root = modInfo.root;
      if (root && sourceConfig.get(root) === root) {
        // 说明确实加载的是某个root下面的模块.
        // TODO 支持root下面的模块加载.
        throw 'not support install root module';
      }

      that.updateModInfo(modInfo, sourceConfig.get(modInfo.name));

      modInfo.to = to; 
      ProjectFactory.getProjectModel('install', modInfo, function(model) {
        that.install(model, function(err) {
          if (err) {
            throw err.errCode 
          }
          console.info(MESSAGE.SUCCESS, modInfo.name, to);
          callback();
        });
      });

    }, function(err) {
      if (err) {
        callback(err);
      }

      callback();
    });
  });
};

// 获取源地址
Install.prototype.getFrom = function() {
  var from = FROM_DEFAULT; 
  var globalConfig = path.join(home, '.spm', 'config.json');
  if (fsExt.existsSync(globalConfig)) {
    var config = {};
    try {
      config = JSON.parse(fsExt.readFileSync(globalConfig));
      var sources = config.sources;
      if (sources) {
        if (Array.isArray(config.sources)) {
          from = sources[0]; 
        } else {
          from = sources;
        }
      }
    } catch(e) {
      console.warn('parse ' + globalConfig + ' error!');
    }
  }  
  
  if (argv.from) {
    from = argv.from;
  } 

  if (argv.root) {
    from = from + '/' + argv.root;
  }
  from = fsExt.normalizeEndSlash(from);

  if (from.indexOf('http') < 0) {
    from = 'http://' + from;
  }

  return from;
};

// 暂不支持依赖下载.
Install.prototype.install = function(model, callback) {
  var that = this;
  var file = model.installFiles[0];
  var modId = model.getModuleId(file);
  model.moduleSources.getSourceModule(modId, function(err, modId, filePath) {
    var codeDir = path.dirname(filePath);
    var to = path.join(model.to, model.name, model.version);

    // spm install already-exists
    if (fs.existsSync(to) && !argv.force) {
      console.info(MESSAGE.ALREADY_EXISTS, to);
      callback({ errCode: 'ALREADY_EXISTS'});
      return;
    }

    fsExt.mkdirS(to);
    fsExt.copydirSync(codeDir, to);
    callback();
  });
};

Install.prototype.getTo = function() {
  if (argv.to) {
    return fsExt.perfectLocalPath(argv.to);
  }
  return process.cwd();
};

// 根据用户传入的模块名称，获取模块基本信息.
Install.prototype.getBasicModInfo = function(arg) {
  var modInfo = {};
  var from = this.from;
  var parts = arg.split('@');
  var name = parts[0];
  modInfo.version = parts[1];

  modInfo.name = name;

  if (name.indexOf('.') > 0) {
    name = name.split('.');
    modInfo.root = name[0];
    modInfo.name = name.splice(1).join('.');
  }
  return modInfo;
};

Install.prototype.updateModInfo = function(modInfo, infos, callback) {
  var version = modInfo.version; 

  if (!version) {
    // 需要计算最新的版本.
    version = Object.keys(infos).sort(semver.lt)[0]
  }
  modInfo.version = version;

  // such as http://modules.seajs.org/jquery/1.7.1/
  // get files to install
  var files = infos[version]; 
  if (!files) {
    // 如果此版本的模块没有找到.
    console.info(MESSAGE.NOT_FOUND, modInfo.name + '@' + modInfo.version)
    throw 'NOT_FOUND';
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

function noop() {

}

module.exports = Install;
