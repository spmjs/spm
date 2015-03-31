require('colorful').colorful();

var path = require('path');
var rimraf = require('rimraf').sync;
var nico = require('nico-spm');
var spmrc = require('spmrc');
var log = require('spm-log');
var readJSON = require('fs-extra').readJSONSync;
var upload = require('./upload');
var DOC_PATH = '_site';

module.exports = function(argv, callback) {
  callback = callback || noop;
  if (argv.clean) cleanDoc();
  if (argv.build) return build(argv, callback);
  if (argv.server || argv.watch) return server(argv, callback);
  if (argv.publish) return publish(argv, callback);
};

module.exports.build = build;
module.exports.server = server;
module.exports.publish = publish;

function build(argv, callback) {
  argv.config = getThemePath();
  nico.build(argv);
  callback();
}

function server(argv, callback) {
  argv.config = getThemePath();
  argv.port = argv.port || 8000;
  nico.server(argv, callback);

  log.warn('start webpack');
  var sw = require('spm-webpack');
  var getWebpackOpts = sw.build.getWebpackOpts;
  var webpack = sw.webpack;
  getWebpackOpts({cwd:process.cwd(),debug:true,verbose:true}, function(err, webpackOpts) {
    webpackOpts.devtool = '#eval';
    webpackOpts.watch = true;
    webpackOpts.output.library = webpackOpts.pkg.name;
    webpackOpts.output.libraryTarget = 'this';
    var compiler = webpack(webpackOpts, function(err, stats) {
      if (err) log.error('error', err);
      printResult(stats);
    });
    //compiler.plugin('compile', function(stats) {
    //  log.info('build', 'compile');
    //});
    //compiler.plugin('invalid', function(stats) {
    //  log.info('build', 'invalid');
    //});
    //compiler.plugin('done', function(stats) {
    //  log.info('build', 'done');
    //});
  });
}

function printResult(stats) {
  log.debug('stats', '\n' + stats.toString());

  stats = stats.toJson();

  (stats.errors || []).forEach(function(err) {
    log.error('error', err);
  });

  stats.assets.forEach(function(item) {
    var size = (item.size/1024.0).toFixed(2) + 'kB';
    log.info('generated', item.name, size.to.magenta.color);
  });
}

function publish(argv, callback) {
  build(argv, noop);
  var pkg = readJSON('package.json');
  var registry;
  if (pkg && pkg.spm) {
    registry = pkg.spm.registry;
  }
  upload({
    doc: DOC_PATH,
    registry: argv.registry || registry
  });
  callback();
}

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

function noop() {}
