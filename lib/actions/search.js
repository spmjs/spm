var request = require('request');
var fs = require('fs');
var path = require('path');
var async = require('async');

var ActionFactory = require('../core/action_factory.js');
var fsExt = require('../utils/fs_ext.js');
var help = require('../utils/moduleHelp');


// 工具类加载

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var fileDir = process.cwd();
var Search = ActionFactory.create('Search');


Search.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('search module info.\nUsage: spm search [options]');
  opts.add('r', 'root', 'set module root.');
  opts.defaultValue('root', '');
};

var argv; 

var errMsg = 'Unable to get the information you need. Please check your configuration!';
Search.prototype.run = function() {
  argv = this.opts.argv;
  if (argv._.length < 2) {
    error();
    return;
  }
  var moduleName = argv._[1];
  var globalConfigPath = path.join(process.env.HOME, '.spm', 'config.json');
  var config = getObjByPath(globalConfigPath); 
  var sources = config.sources;

  if (!sources || sources.length == 0) {
    console.error(errMsg);
    return;
  }

  sources = sources.map(function(source) {
    if (source.indexOf('http') !== 0) {
      return 'http://' + source;
    } else {
      return source;
    }
  });

  var requestUrls = sources.map(function(source) {
    return source + '/' + path.join(argv.r, moduleName, 'info.json');
  });
console.log(requestUrls);

  async.detectSeries(requestUrls, function(requestUrl, callback) {

    request.head(requestUrl, function(err, res) {
      console.log('HTTP HEAD ' + ((res && res.statusCode) || 'error') + ' ' + requestUrl);
      callback(!err && (res.statusCode == 200));
    });

  }, function(requestUrl) {

    if (!requestUrl) {
      // 如果没有在服务器发现资源提示警告信息.
      error();
      return;
    }
console.log('HTTP GET ' + requestUrl);
    request(requestUrl, function(err, res, body) {
      if (err) {
        error();
        return;
      } 
      try {
        console.info(body);
      } catch(e) {
        error();
      }
    });
  });
}

function error() {
  console.error(errMsg);
}

function getObjByPath(filepath) {
  if (!fs.existsSync(filepath)) {
    return {};
  }
  return eval('(' + fs.readFileSync(filepath) + ')');
}

module.exports = Search;

