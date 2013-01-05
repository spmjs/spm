var fs = require('fs');
var path = require('path');
var util = require('util');
require('colorful').colorful();
var logging = require('colorful').logging;
var _ = require('underscore');
var async = require('async');
var dependency = require('../library/dependency');
var iduri = require('../library/iduri');
var cli = require('../library/cli');
var pathlib = require('../utils/pathlib');


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

  files.forEach(function(file) {
    logging.debug('compiling %s', file);
    //compileFile(file, settings);
  });

  logging.debug('distributing ...');

  logging.debug('compress ...');

  logging.end('spm build finished!  ' + '❤'.to.magenta.color);
};


// helpers
function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color);
  process.exit(1);
}
