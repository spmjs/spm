var fs = require('fs');
var path = require('path');

var csslint = require('./lint/csslint.js');
var jshint = require('./lint/jshint.js');
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

var lintPlugin = module.exports = Plugin.create('lint');

lintPlugin.run = function(project, callback) {
  var checkDir = project.getConfig('sourceFiles') || project.srcDirectory;
  var type = project.type;
  var argv = this.argv;

  if (!project.getConfig('lint') && argv.rawArgs[2] !== 'lint') {
    callback();
    return;
  }

  checkDir = moduleHelp.perfectLocalPath(checkDir);

  if (fsExt.isDirectory(checkDir)) {
    fsExt.listFiles(checkDir, new RegExp(type + '$')).forEach(function(f) {
      lint(f, argv);
    });
  } else if (fsExt.isFile(checkDir)) {
    lint(checkDir, argv);
  }

  callback();
};

function lint(f, argv) {
  var ext = path.extname(f);

  if (ext === '.js') {
    jshint(f, argv);
  }

  if (ext === '.css') {
    csslint(f, argv);
  }
}
