var fs = require('fs');
var path = require('path');
var async = require('async');
var request = require('request');
var prettyJson = require('prettyjson');

var env = require('../utils/env.js');
var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('../core/action_factory.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');


var Env = ActionFactory.create('Env');

Env.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('setup spm environment.');
  opts.add('clean', 'clean local source.');
  opts.add('init', 'download default config.json.');
  opts.add('info', 'show ~/.spm/config.json.');
};

var argv;
var err = null;
var errMsg = 'setup spm environment failure!';
var succMsg = 'setup spm environment success!';

Env.prototype.execute = function(options, cb) {
  var home = env.home;
  argv = options || this.argv;

  if (!argv.clean && !argv.init && !argv.alipay && !argv.info) {
    console.info(this.opts.help());
    return;
  }

  var queue = async.queue(function(fn, callback) {
    fn(callback);
  }, 2);

  queue.drain = function() {
    if (err) {
      console.error(errMsg);
    } else {
      console.info(succMsg);
    }
  };

  if (argv.clean) {
    queue.push(function(callback) {
      // del ~/.spm/
      fsExt.rmdirRF(path.join(home, '.spm', 'sources'));
      callback();
    });
  }

  if (argv.init) {
    queue.push(function(callback) {
      var source = 'http://modules.seajs.org';
      if (typeof argv.init !== 'boolean') {
        source = argv.init;
      }
      var configUrl = source + '/config.json';
      request.head(configUrl, function(err, res, body) {
        if (!err && (res.statusCode < 400)) {
          // fix https://github.com/seajs/spm/issues/313
          fsExt.mkdirS(path.join(home, '.spm'));
          request(configUrl).pipe(fs.createWriteStream(path.join(home,
            '.spm', 'config.json'))).on('close', function() {
            callback();
          });
        } else {
          err = 'err';
        }
      });
    });
  }

  if (argv.alipay) {
    // init alipay config.
    var configHome = path.join(home, '.spm', 'config.json');
    var configJson = {
      "sources": ["arale.alipay.im:8000"]
    };

    fsExt.writeFileSync(configHome, JSON.stringify(configJson));
    console.info('init alipay environment success!');
  }

  if (argv.info) {
    var configPath = path.join(home, '.spm', 'config.json');

    if (!fsExt.existsSync(configPath)) {
      console.warn('Not found global config.');
      return;
    }

    var configStr = fsExt.readFileSync(configPath);
    var configObj = JSON.parse(configStr);

    console.info(prettyJson.render(configObj));
  }
};

module.exports = Env;
