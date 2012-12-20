var jshint = require('jshint').JSHINT;
var fsExt = require('../../utils/fs_ext.js');

module.exports = function(filePath) {
  var result = jshint(fsExt.readFileSync(filePath));
    if (!result) {
      console.info('lintint ' + filePath + ' find some errors...');
      errorReports(jshint.errors);
      console.empty();
    }
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
