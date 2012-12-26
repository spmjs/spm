var path = require('path');
var async = require('async');
var _ = require('underscore');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('combine');

// TODO 根据output的配置，进行合并.
plugin.run = function(project, callback) {
  var combine = project.combine;
  if (!_.isObject(combine) || _.isEmpty(combine)) {
    callback();
    return;
  }

  var build = project.buildDirectory;

  async.forEach(_.keys(combine), function(name, cb) {
    var destFilePath = path.join(build, name); 
    var files = combine[name];

    if (_.isString(files)) {
      files = [files];
    }

    var codes = [];

    async.forEachSeries(files, function(f, cb) {

      if (!moduleHelp.isUrl(f)) {
        f = path.join(build, f);
      }

      fsExt.readFile(f, function(body) {
        if (!body) {
          throw new Error('读取文件' + f + '错误');
        } 

        codes.push(body);
        fsExt.rmSync(f);
        cb();
      });
    }, function() {
      fsExt.writeFileSync(destFilePath, codes.join(''));
      cb();
    });
  }, function() {
    callback();
  });
};

