var fs = require('fs');
var path = require('path');
var jshint = require('jshint').JSHINT;
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

var jshintPlugin = module.exports = Plugin.create('lint');

jshintPlugin.param('lint', false, 'enable jshint check.');

jshintPlugin.run = function(project, callback) {
  var argv = this.argv;
  var checkDir = project.sourceFiles || project.srcDirectory;

  if (!this.lint) {
    callback();
    return;
  }

  checkDir = moduleHelp.perfectLocalPath(checkDir);

  if (fsExt.isDirectory(checkDir)) {
    fsExt.listFiles(checkDir, /js$/).forEach(function(f) {
      lint(f);
    });
  } else if (fsExt.isFile(checkDir)) {
    lint(checkDir);
  }

  callback();
};

function lint(f) {
  var result = jshint(fsExt.readFileSync(f));
  if (!result) {
    console.info('lintint ' + f + ' find some errors...');
    errorReports(jshint.errors);
    console.empty();
  }
}

function errorReports(errors) {
  errors.forEach(function(e) {
    if (!e) { return; }
      var pos;
      var evidence = e.evidence;
      var character = e.character;
      if (evidence) {
         // 显示错误代码.
        pos = '[' + ('L' + e.line) + ':' + ('C' + character) + ']';
        console.warn(pos + ' ' + e.reason);
        if (character > evidence.length) {
          // End of line.
          evidence = evidence + ' '.inverse;
        } else {
          // Middle of line.
          evidence = evidence.slice(0, character - 1) + evidence[character - 1].inverse +
             evidence.slice(character);
         }
         console.warn(evidence);
      } else {
         // Generic "Whoops, too many errors" error.
         console.warn(e.reason);
      }
  });
}
