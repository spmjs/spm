 // fileoverview spm install.

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var async = require('async');
var request = require('request');

var ActionFactory = require('../core/action_factory.js');
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
  var modConfig = new ConfigParse();
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

  // TODO 由于modules.seajs.org不支持目录访问，所以暂不支持此功能.
  // spm install all
  /**
    if (modules[0] === 'all') {
      modules = Object.keys(info);
    }
  **/

  modConfig.addUrl(from + 'info.json'); 
  modConfig.once('end', function(config) {
    async.forEach(modules, function(mod, callback) {
      var modInfo = that.getModInfo(mod, config.get(mod)); 
      that.install(modInfo, function() {
        console.info(MESSAGE.SUCCESS, mod, to);
      });
    }, function(err) {
      if (err) {
        callback(err);
      }

      callback();
    });
  });
};

// 暂不支持依赖下载.
Install.prototype.install = function(modInfo, callback) {
  var that = this;
  var installFrom = modInfo.installFrom;
  async.forEachSeries(modInfo.installFiles, function(f, callback) {
    var fileUrl = installFrom + f;
    var to = path.join(that.to, modInfo.name, modInfo.version);
    fsExt.mkdirS(to);
console.info('------->', fileUrl)
    request(fileUrl).pipe(fs.createWriteStream(path.join(to, f))).on('close', function() {
      callback();
    });
  }, function(err) {
    if (err) {
      console.error('istall ' + modInfo.name + ' error!');
    }
    callback();
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

Install.prototype.getTo = function() {
  if (argv.to) {
    return fsExt.perfectLocalPath(argv.to);
  }
  return process.cwd();
};

Install.prototype.getModInfo = function(arg, infos, callback) {
  var modInfo = {};
  var from = this.from;
  var parts = arg.split('@');
  var name = parts[0];
  var version = parts[1];

  modInfo.name = name;
  if (!version) {
    // 需要计算最新的版本.
    version = Object.keys(infos).sort(semver.lt)[0]
  }
  modInfo.version = version;

  // such as http://modules.seajs.org/jquery/1.7.1/
  modInfo.installFrom = from +
      [name, version, ''].join('/');

  // get files to install
  var files = infos[version]; 
  var debugFiles = files.filter(function(f) {
    return /\.js$/.test(f);
  }).map(function(f) {
    return f.replace(/\.js$/, '-debug.js');
  });

  files = files.concat(debugFiles);

  modInfo.installFiles = files;
  return modInfo;
};


Install.prototype.install11 = function(meta, callback) {
  var dir = path.join(meta.dirpath, meta.version);
  var to = path.resolve(argv.to, dir);

  // spm install already-exists
  if (fs.existsSync(to) && !argv.force) {
    console.info(MESSAGE.ALREADY_EXISTS, dir);
    callback({ errCode: -3 });
    return;
  }

  // spm install name
  fsExt.mkdirS(to);
  meta.installTo = to;
  done.N = meta.installFiles.length;

  meta.installFiles.forEach(function(file) {
    fsExt.readFile(meta.installFrom + file, function(code) {
      fs.writeFileSync(path.join(to, file), code, 'utf8');
      done();
    });
  });

  function done() {
    if (typeof done.times === 'undefined') {
      done.times = 0;
    }

    if (++done.times === done.N) {
      console.info(MESSAGE.SUCCESS, meta.name, meta.version);
      callback({ 'meta': meta });
    }
  }
};


function getDependencies(meta) {
  var deps = meta.dependencies || [];

  // "dependencies": {
  //   "a": ">=1.2.0"
  // }
  if (typeof deps === 'object') {
    deps = Object.keys(deps);
  }
  // @dependencies a,b
  else if (typeof deps === 'string') {
    deps = deps.split(/\s*,\s*/);
  }

  return deps;
}


function noop() {

}


module.exports = Install;
