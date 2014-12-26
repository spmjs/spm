require('colorful').colorful();

var path = require('path');
var rimraf = require('rimraf').sync;
var nico = require('nico');
var spmrc = require('spmrc');
var log = require('spm-log');
var readJSON = require('fs-extra').readJSONSync;
var upload = require('./upload');
var DOC_PATH = '_site';

module.exports = function(program, callback) {

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
    var pkg = readJSON('package.json');
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
  rimraf(DOC_PATH);
  log.info('removed', '_site folder');
}
