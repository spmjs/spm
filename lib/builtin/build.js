var fs = require('fs');
var path = require('path');
var util = require('util');
require('colorful').colorful();
var logging = require('colorful').logging;
var _ = require('underscore');
var async = require('async');
var compiler = require('../library/compiler');
var cli = require('../library/cli');
var __require = require('../utils').require;
var pathlib = require('../utils/pathlib');

var defaultCompilers = [
  compiler.BaseCompiler, compiler.JSCompiler, compiler.JCSSCompiler,
  compiler.JtplCompiler
];


exports.description = 'build a cmd module';

exports.run = function(commander) {
  if (commander.interrupt) {
    logging.once('logging-warn', interrupt);
    logging.once('logging-error', interrupt);
  }
  logging.start('spm build');

  logging.debug('parse command line options');
  var settings = cli.getConfig(commander.config);
  settings = cli.mergeConfig(settings, commander);

  logging.debug('collecting source files');
  var files = pathlib.walkdirSync(settings.inputDirectory);

  // start of compiling
  logging.start('Start Compiling');
  var _compilers = settings.compilers || defaultCompilers;

  var qcompile = async.queue(function(task, callback) {
    var TaskCompiler = task.Compiler, filepath = task.filepath;
    var _compiler = new TaskCompiler(filepath, settings);
    logging.debug('%s is compiling %s', _compiler.name, filepath);
    _compiler.run(callback);
  }, 4);

  files.forEach(function(filepath) {
    _compilers.forEach(function(c) {
      var C = __require(c);
      if (C.prototype.validate(filepath)) {
        qcompile.push({Compiler: C, filepath: filepath}, function(err) {
          if (err) logging.error(err);
        });
      }
    });
  });

  qcompile.drain = function() {
    // end of compiling
    logging.end('compiled files are in .spm-build');

    logging.debug('distributing ...');

    // clean .spm-build
    logging.debug('compress ...');

    logging.end('spm build finished!  ' + '❤'.to.magenta.color);
  }
};


// helpers
function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color);
  process.exit(1);
}
