'use strict';

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
var publish = module.exports = Plugin.create('publish');
var argv;

publish.run = function(project, callback) {
  var source = project.getSource();
  argv = this.argv;

  if (!source) {
    console.warn(' The source unavailable!');
    callback();
    return;
  }
 
  source = source + '/' + project.root;

  this.publish(project, source, callback);
};

// TODO test sources is available
publish.publish = function(project, source, cb) {
  async.waterfall([
    function(cb) {
      getValidSource(project, source, allowOverrideUpload(project), cb);
    },
    function(sources, cb) {
      if (sources.length === 0) {
        cb('没有找到符合要求的源, 或者你发布的模块已经是稳定版!');
        return;
      }
      _publish(sources, cb);
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


// 上传到服务器.
function _publish(sources, cb) {
  console.log(' upload tar to server ', tarPath, sources);

  async.forEach(sources, function(source, cb) {

    source = addParam(source, {stable: true});

    var options = {
      url: source,
      method: 'put'
    };

    request(options, function(err, res, body) {
      if (err || res.statusCode > 299) {
        console.warn('publish module error!(' + body + ')');
      }
      console.info('publish upload module to ' + source);
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

