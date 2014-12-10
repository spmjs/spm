require('colorful').colorful();

var path = require('path');
var spawn = require('win-spawn');
var nico = require('nico');
var log = require('nico/lib/sdk/log');
var spmrc = require('spmrc');
var upload = require('./upload');
var file = require('../lib/sdk/file');
var DOC_PATH = '_site';

module.exports = function(program, callback) {
  program.color = true;
  log.config(program);

  callback = callback || function() {};

  program.config = getThemePath();

  if (program.clean) {
    cleanDoc();
  }

  if (program.build) {
    nico.build(program);
    callback && callback();
  }

  if (program.server || program.watch) {
    program.port = program.port || 8000;
    nico.server(program, callback);
  }

  if (program.publish) {
    cleanDoc();
    nico.build(program);
    var pkg = file.readJSON('package.json');
    var registry;
    if (pkg && pkg.spm) {
      registry = pkg.spm.registry;
    }
    upload({
      doc: DOC_PATH,
      registry: program.registry || registry
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
