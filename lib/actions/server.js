var http = require('http');
var fs = require('fs');
var util = require('util');
var url = require('url');
var path = require('path');
var async = require('async');
var mime = require('mime');
var querystring = require('querystring');
var request = require('request');

// 工具类加载
var tar = require('../utils/tar.js');
var fsExt = require('../utils/fs_ext.js');

var ModuleInfoQueue = require('./server/module_info_queue.js');
// 项目配置文件解析，产生出项目模型
var ActionFactory = require('../core/action_factory.js');
var ProjectFactory = require('../core/project_factory.js');

var fileDir = process.cwd();

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
});

// # alias # arale handy
// 对用户请求的#解析到arale, handy, 
// spm server --mapping 

var Server = ActionFactory.create('server');

Server.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('start source server. Usage: spm server [options]');
  opts.add('p', 'port', 'server port');
  opts.add('proxy', 'set proxy source.');

  opts.defaultValue('port', '8000');
};

// 设置缓存目录.
var tempDir = path.join(fileDir, '_temp');
var argv;

var MQ = new ModuleInfoQueue(fileDir);

Server.prototype.run = function() {

  argv = this.opts.argv;
  fsExt.rmdirRF(tempDir);
  fsExt.mkdirS(tempDir);
  // 加载默认配置
  // loadConfig();

  // 根据当前执行目录，查找配置文件，构建项目信息。
  http.createServer(function(req, res) {
    if (isfavicon(req.url, res)) {
      return;
    }

    console.info('http' + req.method + ': ' + req.url);

    var queryPath = req.url;

    if (req.method === 'GET') {
      renderPath(queryPath, res);
    } else if (req.method === 'PUT') {
      addModule(queryPath, req, res);
    } else if (req.method === 'HEAD') {
      checkModule(queryPath, res);
    }

  }).listen(argv.p);
};

function isfavicon(queryPath, res) {
  if (queryPath.indexOf('favicon.ico') > -1) {
    res.write('<html><title>title</title><head></head><body></html>');
    return true;
  }
  return false;
}

function addModule(modulePath, req, res) {
  var temp = path.join(tempDir, 't' + parseInt(Math.random() * 10000000));
  fsExt.mkdirS(temp);

  tar.extract(req, temp, function() {
    // 在把tar包打包到相应的位置
    var files = fs.readdirSync(temp);

    // 获取模块临时目录.
    var tempModuleDir = path.join(temp, files[0]);

    // 获取模块配置信息.
    var configPath = path.join(tempModuleDir, 'package.json');

    if (!fsExt.existsSync(configPath)) {
      console.end('module information not complete!');
      res.end();
      return;
    }

    var config = eval('(' + fs.readFileSync(configPath) + ')');

    // 获取root, root以用户请求的路径为准.
    // var root = path.join('.', url.parse(modulePath).path); ;
    var root = modulePath.slice(1);

    // 获取模块部署目录.
    modulePath = path.join(fileDir, root, config.name, config.version);

    console.info('modulePath:' + modulePath);

    copyModule(tempModuleDir, modulePath, files[0], function() {
      // copy dist file to right dir.
      fsExt.copydirSync(path.join(modulePath, 'dist'), path.join(modulePath));
      setTimeout(function() {
        fsExt.rmdirRF(path.join(modulePath, 'dist'));
        MQ.register(root, config);
      }, 50);
      res.end();
    });
  });
}


// 把tar包copy到对应的位置
function copyModule(moduleDir, modulePath, moduleName, callback) {
  console.info('copy module ', moduleDir, modulePath);

  if (!fsExt.existsSync(modulePath)) {
    fsExt.mkdirS(modulePath);
  }

  var moduleTarPath = path.join(modulePath, moduleName + '.tgz');

  fsExt.copydirSync(moduleDir, modulePath);

  tar.create(moduleDir, moduleTarPath, function() {
    console.log('pack tar ' + moduleTarPath + ' success!');
    callback();
  });
}

function checkModule(queryPath, res) {
  console.log('queryPath---->', queryPath)
  var realPath = path.join(fileDir, queryPath);
  var statusCode = 200;
  if (!fsExt.existsSync(realPath)) {
    if (argv.proxy) {
      proxyCheck(queryPath, function(err) {
        if (err) {
          writeHeader(res, 404); 
        } else {
          writeHeader(res, 200); 
        } 
      }); 
    } else {
      writeHeader(res, 404); 
    }
  } else {
    writeHeader(res, 200); 
  }
}

// TODO 是否支持多个源.
function proxyCheck(queryPath, callback) {
  var requestUrl = getProxyUrl(queryPath);
  request.head(requestUrl, function(err, res) {
    console.info('PROXY: HTTP HEAD ' + requestUrl + ' ' + ((res && res.statusCode) || 'error'));
    var err = null;
    if (err || res.statusCode > 299) {
      err = 'not found';
    }
    callback(err);
  });
}

function writeHeader(res, statusCode) {
  res.writeHeader(statusCode, {'Content-Type': 'text/html;charset=UTF-8'});
  res.end();
}

var renderPath = function(modulePath, res) {
  Type.getReqType(modulePath).output(res);
};

var Type = function(queryPath) {
  this.contentType = 'text/html';
  this.data = [];
  this.queryPath = queryPath;
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
    res.write('<html><title>SPM SOURCES</title><head></head><body>');
  },
  outputHtmlBody: function(res) {
    var data = this.getData();
    if (!data) {
      res.writeHeader(404, {'Content-Type': this.contentType + ';charset=UTF-8'});
      data = 'not found module ' + this.queryPath;
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
    var ext = path.extname(this.queryPath);
    if (ext === '.tgz') {
      return 'application/octet-stream';
    }
    return mime.lookup(path.basename(this.queryPath));
  }
};

// 获取请求数据类型.
Type.getReqType = function(queryPath) {
  var filepath = path.join(fileDir, queryPath);

  if (fsExt.isDirectory(filepath)) {
    return new DirType(queryPath);
  }  
  return new FileType(queryPath);
};

var DirType = function() {
  Type.apply(this, arguments);
  this.realPath = path.join(fileDir, this.queryPath);
};

util.inherits(DirType, Type);

DirType.prototype.getData = function() {
  var that = this;
  var data = [];
  var realPath = path.join(fileDir, this.queryPath);
  if (!fsExt.existsSync(this.realPath)) {
    fsExt.mkdirS(this.realPath);
    return " ";
  }

  if (this.queryPath !== '/') {
    data.push(this.getLink('..'));
  }
  var invalidNameReg = /^_|^temp$/;
  try {
    fs.readdirSync(realPath).forEach(function(name) {
      if (invalidNameReg.test(name)) return; 
      data.push(that.getLink(name));
    });
    return data.join('<br/>');
  } catch (e) {
    return null;
  }
};

DirType.prototype.getLink = function(title) {
  //var newUrl = 
  var newUrl = '' + path.join(this.queryPath, title);
  // console.log('getLink--->', this.queryPath)
  // console.log('tilte--->', title)
  return '<a href="' + newUrl + '">' + title + '</a>';
};

var FileType = function() {
  Type.apply(this, arguments);
  this.contentType = this.getContentType(this.pathname);
};

util.inherits(FileType, Type);

FileType.prototype.output = function(res) {
  // this.outputHeader(res);
  var filepath = path.join(fileDir, this.queryPath);
  if (!fsExt.existsSync(filepath)) {

    if (argv.proxy) {
      // TODO 检查代理.
      this.proxy(res, this.queryPath);
    } else {
      writeHeader(res, 404); 
    }
  } else {

    // console.info('read -->', filepath);
    res.writeHeader(200, {'Content-Type': this.getContentType() + ';charset=UTF-8'});
    fs.createReadStream(filepath).pipe(res);
  }
};

FileType.prototype.notFound = function(res) {
  res.writeHeader(404, {'Content-Type': this.getContentType() + ';charset=UTF-8'});
  var data = 'not found module ' + this.queryPath;
  res.write('' + data);
  res.end();
};

FileType.prototype.proxy = function(res, queryPath) {
  var proxy = argv.proxy;
  var that = this;
  var requestUrl = getProxyUrl(queryPath);
  
  request(requestUrl).pipe(res).on('finish', function() {
    // TODO 是否缓存.
    console.info('proxy ' + requestUrl + ' success!');
  });
};

function getProxyUrl(queryPath) {
  var proxy = argv.proxy;
  var requestUrl = proxy + queryPath;
  if (requestUrl.indexOf('http') !== 0) {
    requestUrl = 'http://' + requestUrl;
  }
  return requestUrl;
}




module.exports = Server;

// TODO 1. 梳理info.json队列. 主要是以此象上注册模块信息.
