// upload tar to server.
var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var request = require('request');
var async = require('async');
var _ = require('underscore');

var moduleHelp = require('../utils/module_help.js');
var fsExt = require('../utils/fs_ext.js');

var Plugin = require('../core/plugin.js');
var Sources = require('../core/sources.js');
var upload = module.exports = Plugin.create('upload');
var argv;

upload.run = function(project, callback) {
  var source = project.getSource();
  argv = this.argv;

  if (!source) {
    console.warn(' The source unavailable!');
    callback();
    return;
  }

  // 如果是本地源，则install已经完成相关工作.
  if (moduleHelp.isLocalPath(source)) {
    callback();
    return;
  }
  var root = project.root || '';

  if (root) {
    source = source + '/' + project.root;
  }

  console.log('source-->', source);

  var tarName = project.name + '.tgz';

  var tarPath = path.join(project.buildDirectory, '_tar', project.name, tarName);
  this.uploadTarToServer(project, tarPath, project.sources, callback);
};

// TODO test sources is available
upload.uploadTarToServer = function(project, tarPath, source, cb) {
  async.waterfall([
    function(cb) {
      getValidSource(project, source, allowOverrideUpload(project), cb);
    },
    function(sources, cb) {
      if (sources.length === 0) {
        cb('没有找到符合要求的源, 或者你上传的模块已经是稳定版!');
        return;
      }
      _uploadTarToServer(tarPath, sources, cb);
    }
  ], function(err) {
    if (err) {
      console.error(err);
    }
    cb();
  });
};

// 检查是否有符合要求的源。主要是针对 root.
// TODO 还需要检查是否允许覆盖.
// ('Server prohibited module override.' +  '(Server override strategy is ' + project.getConfig('override') + ')');
function getValidSource(project, sources, override, cb) {
  if (_.isString(sources)) {
    sources = [sources];
  }

  if (project.name === 'seajs') {
    cb(null, sources);
    return;
  }
  var validSources = [];
  var force = argv.force || false;

  async.forEachSeries(sources, function(source, cb) {
    source = fsExt.normalizeEndSlash(source);
    Sources.loadUrl(source + 'config.json', function(body) {
      if (isSuitable(body, project.root)) {
        isStable(project, function(stable) {
          if (!stable || force) {
            source = source + project.root;
            validSources.push(source);
          }
          cb();
        });
      } else {
        cb();
      }
    }, true);
  }, function() {
    cb(null, validSources);
  });
}

function isSuitable(config, root) {
  var roots = config.roots;
  return config && roots && roots.indexOf(root) > -1;
}

function isStable(project, cb) {
  project.getSourceModuleInfo(project.root, function(info) {
    if (!info || !info[project.name]) {
      cb(false);
      return;
    }

    var modInfo = info[project.name];
    var stable = modInfo.stable;
    cb(stable && stable.indexOf(project.version) > -1);
  });
}

// 检查当前模块是否已存在
function moduleCheck(source, project, cb) {
  var modUrl = source + '/' + project.name + '/' +
          project.version + '/' + 'package.json';
  request(modUrl, function(err, res, body) {
    cb(null, res.statusCode < 399);
  });
}

// 检查模块覆盖策略。
function allowOverrideUpload(project) {
  var override = project.getConfig('override');
  var force = project.getConfig('force');
  console.log('override strategy-->', override, force);

  return !override || override === 'allow' ||
      (override === 'manual' && force);
}

// 上传到服务器.
function _uploadTarToServer(tarPath, sources, cb) {
  console.log(' upload tar to server ', tarPath, sources);
  var body = fs.readFileSync(tarPath);

  async.forEach(sources, function(source, cb) {

    if (argv.stable) {
      source = addParam(source, {stable: true});
    }

    var options = {
      url: source,
      method: 'put',
      body: body,
      headers: {
        'content-length': body.length,
        'content-type': 'application/x-tar-gz'
      }
    };

    request(options, function(err, res, body) {
      if (err || res.statusCode > 299) {
        console.warn('upload module error!(' + body + ')');
      }
      console.info('success upload module to ' + source);
      cb(null);
    });
  }, function() {
    cb(null);
  });
}

function addParam(source, queryObj) {
  var queryStr = [];
  Object.keys(queryObj).forEach(function(key) {
    queryStr.push(key + '=' + queryObj[key]);
  });
  queryStr = queryStr.join('&');
  var sep = source.indexOf('?') > 0 ? '&' : '?';
  return source + sep + queryStr;
}
