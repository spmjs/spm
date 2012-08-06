var http = require('http');
var fs = require('fs');
var util = require('util');
var url = require('url');
var path = require('path');
var async = require('async');
var mime = require('mime');
var tar = require('tar');
var fstream = require('fstream');
var zlib = require('zlib');
var querystring = require('querystring');

var ActionFactory = require('./action_factory.js');
var fsExt = require('../utils/fs_ext.js');

// 工具类加载

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('./build/core/project_factory.js');

var fileDir = process.cwd();

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
});


// # alias # arale handy
// 对用户请求的#解析到arale, handy, 
// spm server --mapping 

var argv = require('optimist').
    usage('Usage: $0 -p[server port] --mapping[dir mapping] -r[root]')[
    'default']('p', '8000')[
    'default']('mapping', false).
    argv;

var Server = ActionFactory.create('Server');


var tempDir = path.join(fileDir, '_temp');

Server.prototype.run = function() {
  fsExt.rmdirRF(tempDir);
  fsExt.mkdirS(tempDir);

  var instance = this;
  var options = this.options;
  var context = argv.d || '.';

  // 根据当前执行目录，查找配置文件，构建项目信息。
  http.createServer(function(req, res) {
console.info('http' + req.method + ': ' + req.url);
    var queryUrl = req.url;
    queryUrl = path.join(context, req.url);

    if (isfavicon(queryUrl, res)) {
      return;
    }

    if (req.method === 'GET') {
      renderPath(queryUrl, res);
    } else if (req.method === 'PUT') {
      addModule(queryUrl, req, res);
    } else if (req.method === 'HEAD') {
      checkModule(queryUrl, res);
    }

  }).listen(argv.p);
};

function isfavicon(queryUrl, res) {
  if (queryUrl.indexOf('favicon.ico') > -1) {
    res.write('<html><title>title</title><head></head><body></html>');
    return true;
  }
  return false;
}

function addModule(queryUrl, req, res) {
  var temp = path.join(tempDir, 't' + parseInt(Math.random() * 10000000));
  fsExt.mkdirS(temp);
  req.pipe(zlib.Unzip()).
    pipe(tar.Extract({path: temp})).
    on('error', function() {
      console.error('error----');
    }).
    on('close', function() {
      // 读取tar包信息
      // 在把tar包打包到相应的位置
      var files = fs.readdirSync(temp);

      // 获取模块临时目录.
      var tempModuleDir = path.join(temp, files[0]);

      // 获取模块部署目录.
      var modulePath = getModulePath(tempModuleDir, queryUrl);
console.log('modulePath:' + modulePath);

      if (!modulePath) {
        console.error('module read error !');
        res.end();
      } else {
        copyModule(tempModuleDir, modulePath, files[0], function() {
          res.end();
        });
      }
    });
}

// 读取配置信息
function getModulePath(tempModulePath, queryUrl) {
console.log('getModulePath-->', tempModulePath);
  var configPath = path.join(tempModulePath, 'package.json');

  if (!fsExt.existsSync(configPath)) {
    return null;
  }

  var config = eval('(' + fs.readFileSync(configPath) + ')');

  // 注册模块信息.
  // 如果无法读取配置文件的root，默认启用在服务启动的时候配置.
  var root = '';
  if (argv.mapping) {
     root = path.join('.', url.parse(queryUrl).path); 
  }

console.info('root--->', root);
  // var root = config.root == '#' ? '' : config.root || argv.r;

  registerModuleInfo(path.join(fileDir, root, config.name), config, root);
  return path.join(fileDir, root, config.name, config.version);
}

// 模块队列列表.
var ModuleQueue = function() {
  this.qs = {};
};

ModuleQueue.prototype.addQueue = function(modulePath, config, root) {
  var moduleName = path.basename(modulePath);
console.log('m--->', modulePath, moduleName, config);
  var mq = this.qs[moduleName];
  if (!mq) {
    mq = {};
    var info = mq.info = getObjByFile(path.join(modulePath, 'info.json'));
    info.name = config.name;
    info.versioning = info.versioning || {};
    info.versioning.versions = info.versioning.versions || [];
    info.subModules = info.subModules || {};
    mq.queue = async.queue(function(config, callback) {

      info.versioning.latest = config.version;
      var versions = info.versioning.versions;
      if (versions.indexOf(config.version) < 0) {
        versions.push(config.version);
      }

      if (!info.subModules) {
        info.subModules = {};
      }

      var subMods = [];
      Object.keys(config.output).forEach(function(mod) {
        subMods.push(getSubModId(root, config, mod));
      });

      info.subModules[config.version] = subMods;
      info.lastUpdated = new Date().getTime();
      callback();
    }, 1);

    mq.queue.drain = function() {
      // 输出info.json
      fsExt.writeFileSync(path.join(modulePath, 'info.json'), JSON.stringify(mq.info));
      console.log('drain----->', util.inspect(mq.info));
    }
    this.qs[moduleName] = mq; 
  }
  mq.queue.push(config);
};

function getSubModId(root, config, subModId) {
  if (!root) {
    root = '#';
  }
 
  var ext = path.extname(subModId);
  if (ext !== '.js') {
    return subModId;
  }
  if (ext) {
    subModId = subModId.slice(0, subModId.indexOf(ext));    
  }
  return path.join(root, config.name, config.version, subModId);
}

var MQ = new ModuleQueue();

/**
 * #info.json
 * {
 *   name: 'moduleName',
 *   versioning: {
 *     latest: '1.1.2', //最新上传的版本.
 *     release: '1.1.0' //最新上传的稳定版本.
 *     versions: ['1.1.2', '1.1.0']
 *   },
 *   subMods: {
 *     '1.1.1': ['a.js', 'b.js']
 *   },
 *   lastUpdated: 20120712055057 // 上次更新时间.
 * }
 */

// 考虑并发. 通过构建一个模块队列，所有需要注册信息都仍到队列中。
// 当queue.drain 的时候输出模块信息.
function registerModuleInfo(path, config, root) {
  MQ.addQueue(path, config, root);
}

// 把tar包copy到对应的位置
function copyModule(moduleDir, modulePath, moduleName, callback) {
  console.info('copy module ', moduleDir, modulePath);

  if (!fsExt.existsSync(modulePath)) {
    fsExt.mkdirS(modulePath);
  }

  var moduleTarPath = path.join(modulePath, moduleName + '.tgz');

  fsExt.copydirSync(moduleDir, modulePath);

  fstream.Reader({path: moduleDir, type: 'Directory'}).
    pipe(tar.Pack()).
    pipe(zlib.createGzip()).
    pipe(fstream.Writer(moduleTarPath)).on('close', function() {
      callback();
    }).on('error', function(err) {
      console.error('error------------>', err);
    });
}

function checkModule(queryUrl, res) {
  var realPath = path.join(fileDir, queryUrl);
  var statusCode = 200;
  if (!fsExt.existsSync(realPath)) {
    statusCode = 404;
  }
  res.writeHeader(statusCode, {'Content-Type': 'text/html;charset=UTF-8'});
  res.end();
}


var renderPath = function(queryUrl, res) {
  Type.getTypeObj(queryUrl).output(res);
};

var Type = function(queryUrl) {
  this.contentType = 'text/html';
  this.data = [];
  this.queryUrl = queryUrl;
};

Type.prototype = {
  outputHeader: function(res) {
    var statusCode = 200;
      if (!fsExt.existsSync(this.realPath)) {
        statusCode = 404;
      }
    res.writeHeader(statusCode, {'Content-Type': this.contentType + ';charset=UTF-8'});
  },
  outputHtmlHead: function(res) {
    res.write('<html><title>title</title><head></head><body>');
  },
  outputHtmlBody: function(res) {
    var data = this.getData();
    if (!data) {
      res.writeHeader(404, {'Content-Type': this.contentType + ';charset=UTF-8'});
      data = 'not found module ' + this.queryUrl;
    }
    res.write('' + data);
  },
  outputHtmlEnd: function(res) {
    res.end('</body></html>');
  },
  output: function(res) {
    this.outputHeader(res);
    this.outputHtmlHead(res);
    this.outputHtmlBody(res);
    this.outputHtmlEnd(res);
  },

  getData: function() {
    throw new Error('This Is A Abstract Class');
  },

  getContentType: function() {
    var ext = path.extname(this.queryUrl);
    if (ext === '.tgz') {
      return 'application/octet-stream';
    }
    return mime.lookup(path.basename(this.queryUrl));
  }
};

var getType = function(path) {
  var index = path.lastIndexOf('.');
  if (index < 0) {
    return 'dir';
  }
  return path.substring(index + 1, path.length);
};

var verReg = /\.\d+(-dev)?/;
Type.getTypeObj = function(queryUrl) {
  var ext = path.extname(queryUrl);
  if (!ext || verReg.test(ext)) {
    return new DirType(queryUrl);
  }
  return new FileType(queryUrl);
};

var DirType = function() {
  Type.apply(this, arguments);
  this.realPath = path.join(fileDir, this.queryUrl);
};

util.inherits(DirType, Type);

DirType.prototype.getData = function() {
  var that = this;
  var data = [];
  var realPath = path.join(fileDir, this.queryUrl);
  if (!fsExt.existsSync(this.realPath)) {
    fsExt.mkdirS(this.realPath);
    return " ";
  }
  try {
    fs.readdirSync(realPath).forEach(function(name) {
      data.push(that.getLink(name));
    });
    return data.join('<br/>');
  } catch (e) {
    return null;
  }
};

DirType.prototype.getLink = function(title) {
  var newUrl = '/' + path.join(this.queryUrl, title);
//console.log('getLink--->', this.queryUrl)
//console.log('tilte--->', title)
  return '<a href="' + newUrl + '">' + title + '</a>';
};

var FileType = function() {
  Type.apply(this, arguments);
  this.contentType = this.getContentType(this.pathname);
};

util.inherits(FileType, Type);

FileType.prototype.output = function(res) {
  this.outputHeader(res);
  var filepath = path.join(fileDir, this.queryUrl);
//console.log('exists---->', fsExt.existsSync(filepath), filepath);
  if (!fsExt.existsSync(filepath)) {
    res.writeHeader(404, {'Content-Type': this.getContentType() + ';charset=UTF-8'});
    var data = 'not found module ' + this.queryUrl;
    res.write('' + data);
    res.end();
  } else {
console.info('read -->', filepath);
    res.writeHeader(200, {'Content-Type': this.getContentType() + ';charset=UTF-8'});
    fs.createReadStream(filepath).pipe(res);
  }
};

function getObjByFile(filepath) {
  if (!fsExt.existsSync(filepath)) {
    return {};
  }
  return eval('(' + fs.readFileSync(filepath) + ')');
}

module.exports = Server;
