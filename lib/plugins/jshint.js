var fs = require('fs');
var path = require('path');
var jshint = require('jshint').JSHINT;
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var jshintPlugin = module.exports = Plugin.create('jshint');

jshintPlugin.param('build', '%buildDirectory%');
jshintPlugin.param('lint', false , 'enable jshint check.');
jshintPlugin.param('source-files', null, 'set need to jshint file [directory]');

jshintPlugin.run = function(callback) {
  if (!this.lint && !this['source-files']) {
    callback();
    return;
  }

  var dir = this['source-files'] || this.build;

  fsExt.listFiles(dir, /js$/).forEach(function(f) {
    var result = jshint(fsExt.readFileSync(f));
    if (!result) {
      console.info('lintint ' + f + ' find some errors...');
      errorReports(jshint.errors);
      console.empty();
    }
  });
  callback();
};

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
