// upload tar to server.
var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var request = require('request');
var async = require('async');

var help = require('../utils/module_help.js');

var Plugin = require('../core/plugin.js');
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
  if (help.isLocalPath(source)) {
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
  this.uploadTarToServer(project, tarPath, source, callback);
};

// TODO test sources is available
upload.uploadTarToServer = function(project, tarPath, source, cb) {
  async.waterfall([
    function(cb) {
      sourceCheck(source, cb); 
    },
    function(cb) {
      moduleCheck(source, project, cb);
    },
    function(exists, cb) {
      console.log('exists-->', exists);
      if (!exists || allowOverrideUpload(project)) {
        _uploadTarToServer(tarPath, source, cb);
      } else {
         cb('Server prohibited module override.' +  
           '(Server override strategy is ' + project.getConfig('override') + ')');
      }
    }
  ], function(err) {
    if (err) {
      console.error(err);
    } 
    cb();
  });
};

// 检查源服务是否有效.
function sourceCheck(source, cb) {
  request(source, function(err, res, body) {
    if (err) {
      cb('upload source error[' + err.code + ']');
    }
    cb(null);
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
function _uploadTarToServer(tarPath, source, cb) {
  console.log(' upload tar to server ', tarPath, source);
  var body = fs.readFileSync(tarPath);

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
    cb(null);
  });
  
  /**
  fs.createReadStream(tarPath).
    pipe(request.put(source)).
    on('end', function() {
      callback();
    });
  **/
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
