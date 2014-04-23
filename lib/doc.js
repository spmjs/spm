var path = require('path');
var spmrc = require('spmrc');
var spm = require('..');
var spawn = require('win-spawn');
var nico = require('nico');
var DOC_PATH = '_site';
var log = require('nico/lib/sdk/log');
var file = require('./sdk/file');
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
    // spm 和 nico 同时用到了 source ，这里只给 spm 用
    var source = commander.source || 'default';
    commander.source = '';
    cleanDoc();
    nico.build(commander);
    spm.upload({
      doc: DOC_PATH,
      source: source
    });
  }

};

function getThemePath() {
  return path.join(__dirname, 'theme', 'nico.js');
}

function cleanDoc() {
  spawn('rm', ['-rf', DOC_PATH]);
  log.info('removed', '_site folder');
}
