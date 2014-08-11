var path = require('path');
var upload = require('./upload');
var spawn = require('win-spawn');
var nico = require('nico');
var DOC_PATH = '_site';
var log = require('nico/lib/sdk/log');
var spmrc = require('spmrc');
require('colorful').colorful();

module.exports = function(commander, callback) {
  commander.color = true;
  log.config(commander);

  callback = callback || function() {};

  commander.config = getThemePath();

  if (commander.clean) {
    cleanDoc();
  }

  if (commander.build) {
    nico.build(commander);
    callback && callback();
  }

  if (commander.server || commander.watch) {
    commander.port = commander.port || 8000;
    nico.server(commander, callback);
  }

  if (commander.publish) {
    cleanDoc();
    nico.build(commander);
    upload({
      doc: DOC_PATH,
      registry: commander.registry
    });
  }

};

function getThemePath() {
  var homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) {
    homeDir = process.env.HOMEDRIVE + process.env.HOMEPATH;
  }
  var defaultTheme = path.join(__dirname, 'theme', 'nico.js');
  var theme = (spmrc.get('doc.theme') || defaultTheme).replace(/^~/, homeDir);
  return theme;
}

function cleanDoc() {
  spawn('rm', ['-rf', DOC_PATH]);
  log.info('removed', '_site folder');
}
