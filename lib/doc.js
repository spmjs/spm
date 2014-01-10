var path = require('path');
var spmrc = require('spmrc');
var spawn = require('win-spawn');
var nico = require('nico');
var DOC_PATH = '_site', pkg;
var spmrc = require('spmrc');
require('colorful').colorful();

module.exports = function(commander, callback) {

  commander.color = true;
  var log = require('nico/lib/sdk/log');
  log.config(commander);

  callback = callback || function() {};

  try {
    pkg = require(path.resolve('package.json'));
    pkg.spm.output;
  } catch(e) {
    console.log(  'Check if package.json and "spm" key existed.');
    process.exit();
  }

  commander.config = getThemePath();

  if (commander.clean) {
    cleanDoc();
  }

  if (commander.build) {
    nico.build(commander, callback);
  }

  if (commander.server || commander.watch) {
    commander.port = commander.port || 8000;
    nico.server(commander);
  }

  if (commander.publish) {
    // spm 和 nico 同时用到了 source ，这里只给 spm 用
    var source = commander.source || 'default';
    commander.source = '';
    cleanDoc();
    nico.build(commander);
    spawn('spm', ['publish', '--doc', DOC_PATH, '-s', source], { stdio: 'inherit' });
  }

};

function getThemePath() {
  return path.join(
    spmrc.get('user.home'),
    '.spm/themes/cmd/nico.js'
  );
}

function cleanDoc() {
  spawn('rm', ['-rf', DOC_PATH]);
}

