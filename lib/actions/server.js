var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('request');
var connect = require('connect');
var async = require('async');

// 工具类加载
var tar = require('../utils/tar.js');
var fsExt = require('../utils/fs_ext.js');
var jsbeautify = require('../help/beautify.js');
var Config = require('../utils/config_parse.js');
var Sources = require('../core/sources.js');
var moduleHelp = require('../utils/module_help.js');

var ModuleInfoQueue = require('./server/module_info_queue.js');
var ActionFactory = require('../core/action_factory.js');

var fileDir = process.cwd();

// # alias # arale handy
// 对用户请求的#解析到arale, handy,
// spm server --mapping

var Server = ActionFactory.create('server');

Server.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('启动一个源服务.');
  opts.option('-p --port [number]', '设置服务端口, 默认 8000', parseInt, 8000);
  opts.option('--proxy [url]', '设置代理源服务 [modules.spmjs.org].');
};

// 设置缓存目录.
var tempDir = path.join(fileDir, '_temp');

// 源服务自身配置。(package.json)
var sourceConfig;

// 源配置缓存，也会加载代理的模块配置.(config.json)
var configCache;

// 源的代理源的配置缓存.
var proxyConfigMapping = {};

var MQ = new ModuleInfoQueue(fileDir);

Server.prototype.run = function() {
  var argv = this.opts;
  var that = this;
  fsExt.rmdirRF(tempDir);
  fsExt.mkdirS(tempDir);

  // 加载默认配置
  // 缓存 config.json
  async.series([loadConfig, cacheConfig], function() {
    var app = connect().
        use(manageConfigCache).
        use(getInfoJson).
        use(connect.query()).
        use(proxyModule).
        use(addModule).
        use(beautify).
        use(connect.static(fileDir, {'maxAge': 200 * 1000})).
        use(connect.directory(fileDir)).
        use(connect.errorHandler()).
        listen(argv.port);
  });
};

var loadConfig = function(cb) {
  var config = new Config();
  var packageJson = path.join(process.cwd(), 'package.json');
  if (fsExt.existsSync(packageJson)) {
    config.addFile(packageJson);
  }

  config.bind('end', function() {
    sourceConfig = config.get();
    cb();
  });
};

var cacheConfig = function(cb) {
  var config = new Config();
  var configJson = path.join(process.cwd(), 'config.json');

  if (fsExt.existsSync(configJson)) {
    configJson = fsExt.readFileSync(configJson);
    configJson = JSON.parse(configJson);
    proxyConfigMapping.main = configJson;
    config.addConfig(configJson);
  }

  async.forEach(getProxyUrl('/config.json'), function(proxy, callback) {
    Sources.loadUrl(proxy, function(body) {
      var proxyConfig = body || '{}';
      proxyConfig = JSON.parse(proxyConfig);
      proxyConfigMapping[getHref(proxy)] = proxyConfig;
      config.addConfig(proxyConfig);
      callback();
    });

  }, function() {
    config.bind('end', function() {
      configCache = config.get();
      cb();
    });
  });
};

function getHref(href) {
  var urlObj = url.parse(href);
  return urlObj.protocol + '//' + urlObj.host;
}

function manageConfigCache(req, res, next) {
  var method = req.method;
  var u = req.url;

  if (method === 'GET') {
    if (u === '/config.json') {
      var str = jsbeautify.js_beautify(JSON.stringify(configCache));
      res.setHeader('Content-Type', 'application/json');
      res.end(str);
    } else if (u === '/_reset') {
      async.series([loadConfig, cacheConfig], function() {
        res.end('reset success');
      });
    } else {
      next();
    }
  } else {
    next();
  }
}

function getInfoJson(req, res, next) {
  var method = req.method;
  var u = req.url;

  if (method === 'GET' && u === '/info.json') {

    var config = new Config();
    var infoJson = path.join(process.cwd(), 'info.json');

    if (fsExt.existsSync(infoJson)) {
      infoJson = fsExt.readFileSync(infoJson);
      infoJson = JSON.parse(infoJson);
      config.addConfig(infoJson);
    }

    async.forEach(getProxyUrl('/info.json'), function(proxy, callback) {
      Sources.loadUrl(proxy, function(body) {
        var proxyConfig = body || '{}';
        proxyConfig = JSON.parse(proxyConfig);
        config.addConfig(proxyConfig);
        callback();
      });

    }, function() {
      config.bind('end', function() {
        infoJson = config.get();
        var str = JSON.stringify(infoJson);

        res.setHeader("Content-Type", "application/json");
        res.writeHeader(200);
        res.end(str);
      });
    });
  } else {
    next();
  }
}

function proxyModule(req, res, next) {
  var method = req.method;

  if ('GET' != method && 'HEAD' != method) return next();
  if (!sourceConfig.proxy) return next();

  var queryPath = getPath(req.url);
  var realPath = path.join(fileDir, queryPath);

  if (!fsExt.existsSync(realPath)) {
    var requestUrl = getProxyUrl(queryPath) || [];
    Sources.getValidUrls(requestUrl, function(err, sources) {
      if (err) {
        console.warn('not found module ' + queryPath);
        res.writeHead(404);
        res.end();
      } else {
        console.info('----proxy module -->', queryPath);
        request[method.toLowerCase()](sources[0]).pipe(res);
      }
    });
  } else {
    return next();
  }
}

function addModule(req, res, next) {
  var method = req.method;

  if ('POST' != method && 'PUT' != method) return next();

  // 检查模块是否符合源的 root 要求.
  var roots = proxyConfigMapping.main.roots;
  var root = getPath(req.url);

  if (root.indexOf('/') === 0) {
    root = root.slice(1);
  }

  if (!roots || (root && roots && roots.indexOf(root) < 0)) {
    // find proxy
    proxies = sourceConfig.proxy || [];
    var proxy, proxies = proxies.slice(0);

    while (proxy = (proxies.shift())) {
      roots = proxyConfigMapping[proxy].roots;

      if (roots && roots.indexOf(root) > -1) {
        req.pipe(request.put(proxy + req.url));
        res.writeHead(200);
        res.end();
        return;
      }
    }

    res.writeHead(404);
    res.end('没有找到合适的源!');
    return;
  }

  var modulePath = getPath(req.url);
  var temp = path.join(tempDir, 't' + parseInt(Math.random() * 10000000));

  fsExt.mkdirS(temp);

  var isStable = req.query && req.query.stable;

  tar.extract(req, temp, function() {
    // 在把tar包打包到相应的位置
    var files = fs.readdirSync(temp);

    // 获取模块临时目录.
    var tempModuleDir = path.join(temp, files[0]);

    // 获取模块配置信息.
    var configPath = path.join(tempModuleDir, 'package.json');

    if (!fsExt.existsSync(configPath)) {
      res.end('module information not complete!');
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

    // 删除模块原有内容
    fsExt.rmdirRF(modulePath);
     
    copyModule(tempModuleDir, modulePath, files[0], function() {
      // copy dist file to right dir.
      //
      var resDirs = fsExt.listDirs(modulePath);

      resDirs.forEach(function(dir) {
        if (dir === 'dist') {
          fsExt.copydirSync(path.join(modulePath, 'dist'), path.join(modulePath));
        } else {
          var extraResDirPath = path.join(modulePath, '_extra_resources');
          fsExt.mkdirS(extraResDirPath);
          fsExt.copydirSync(path.join(modulePath, dir), path.join(extraResDirPath, dir));
        }
      });

      setTimeout(function() {
        resDirs.forEach(function(dir) {
          fsExt.rmdirRF(path.join(modulePath, dir));
        });

        config.stable = isStable;

        MQ.register(root, config);
      }, 50);
      res.end();
    });
  });
}

// 发布一个模块
// 1. 获取当前模块的 info.json
// 2. 更新模块 stable 信息.
function publishModule(root, moduleName, version, callback) {

}

// 把tar包copy到对应的位置
function copyModule(moduleDir, modulePath, moduleName, callback) {
  console.info('copy module ', moduleDir, modulePath);

  if (!fsExt.existsSync(modulePath)) {
    fsExt.mkdirS(modulePath);
  }

  var moduleTarPath = path.join(modulePath, moduleName + '.tgz');

  fsExt.copydirSync(moduleDir, modulePath, function(f) {
    return /^dist/.test(f) || /package\.json$/.test(f);
  });

  tar.create(moduleDir, moduleTarPath, function() {
    console.log('pack tar ' + moduleTarPath + ' success!');
    callback();
  });
}

function getProxyUrl(queryPath) {
  var proxy = sourceConfig.proxy || [];
  return proxy.map(function(p) {
    return moduleHelp.perfectSource(p + queryPath);
  });
}

function beautify(req, res, next) {
  var queryPath = getPath(req.url);

  if (Object.keys(req.query).indexOf('beautify') > -1 && /json|js$/.test(queryPath)) {

    var realPath = path.join(fileDir, queryPath);
    if (fsExt.existsSync(realPath)) {
      var str = fsExt.readFileSync(realPath);
      str = jsbeautify.js_beautify(str);
      if (/json$/.test(queryPath)) {
        res.setHeader("Content-Type", "application/json");
      } else {
        res.setHeader("Content-Type", "application/javascript");
      }
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
