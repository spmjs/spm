var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('request');
var connect = require('connect');

// 工具类加载
var tar = require('../utils/tar.js');
var fsExt = require('../utils/fs_ext.js');
var jsbeautify = require('../help/beautify.js');

var ModuleInfoQueue = require('./server/module_info_queue.js');
var ActionFactory = require('../core/action_factory.js');

var fileDir = process.cwd();

// # alias # arale handy
// 对用户请求的#解析到arale, handy,
// spm server --mapping

var Server = ActionFactory.create('server');

Server.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('start source server.');
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

  var app = connect().
      use(connect.query()).
      use(proxyModule).
      use(addModule).
      use(beautify).
      use(connect.static(fileDir, {'maxAge': 200 * 1000})).
      use(connect.directory(fileDir)).
      use(connect.errorHandler()).
      listen(argv.p);
};

function proxyModule(req, res, next) {
  var method = req.method;
  if ('GET' != method && 'HEAD' != method) return next();

  if (!argv.proxy) return next();

  var queryPath = getPath(req.url);
  var realPath = path.join(fileDir, queryPath);

  if (!fsExt.existsSync(realPath)) {
    var requestUrl = getProxyUrl(queryPath);
    request[method.toLowerCase()](requestUrl).pipe(res);
  } else {
    return next();
  }
}

function addModule(req, res, next) {
  var method = req.method;
  if ('POST' != method && 'PUT' != method) return next();

  var modulePath = getPath(req.url);
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

    if (!fsExt.existsSync(path.join(fileDir, root, 'config.json'))) {
      fsExt.writeFileSync(path.join(fileDir, root, 'config.json'), '{}');
    }

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

function getProxyUrl(queryPath) {
  var proxy = argv.proxy;
  var requestUrl = proxy + queryPath;
  if (requestUrl.indexOf('http') !== 0) {
    requestUrl = 'http://' + requestUrl;
  }
  return requestUrl;
}

function beautify(req, res, next) {
  var queryPath = getPath(req.url);

  if (Object.keys(req.query).indexOf('beautify') > -1 && /json|js$/.test(queryPath)) {

    var realPath = path.join(fileDir, queryPath);
    if (fsExt.existsSync(realPath)) {
      var str = fsExt.readFileSync(realPath);
      str = jsbeautify.js_beautify(str);
      res.end(str);
    } else {
      return next();
    }
  } else {
    return next();
  }
}

function getPath(queryUrl) {
  return url.parse(queryUrl).pathname;
}


module.exports = Server;
// TODO 1. 梳理info.json队列. 主要是以此象上注册模块信息.
