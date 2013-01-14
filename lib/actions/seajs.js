'use strict';

var path = require('path');
var jsbeautify = require('../help/beautify.js');

var fsExt = require('../utils/fs_ext.js');
var ActionFactory = require('../core/action_factory.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var Seajs = ActionFactory.create('Seajs');

Seajs.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('seajs help action!');
  opts.option('--config [flag]', 'create seajs config.');
  opts.option('--force [flag]', 'override exists file!.');
};

Seajs.prototype.execute = function(options, cb) {

  createSeajsConfig(options);
  cb();
};

function createSeajsConfig(options) {

  var base = process.cwd();
  var seajsConfig = {
    alias: {
    }
  };

  var alias = seajsConfig.alias;

  fsExt.list(base, /package\.json/).forEach(function(p) {
    var obj = JSON.parse(fsExt.readFileSync(path.join(base, p)));
    if (obj.root && obj.name) {
      alias[obj.root + '.' + obj.name] = './' + getAlias(obj, p);
    }
  });

  var str = 'seajs.config(' + jsbeautify.js_beautify(JSON.stringify(seajsConfig)) + ');';
  var seajsConfigPath = path.join(base, 'seajs.config');

  if (fsExt.existsSync(seajsConfigPath) && !options.force) {
    console.warn('seajs.config already exists. Turn on --force option if you want to override it.');
  } else {
    fsExt.writeFileSync(seajsConfigPath, str);
  }

  console.info('Create seajs.config success!');
}

function getAlias(obj, p) {
  return path.join(path.dirname(p), obj.name);
}

module.exports = Seajs;

