var fs = require('fs');
var path = require('path');
var util = require('util');
require('colorful').colorful();
var logging = require('colorful').logging;
var _ = require('underscore');
var async = require('async');
var compiler = require('../library/compiler');
var cli = require('../library/cli');
var dependency = require('../library/dependency');
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
  var scripts = settings.scripts || {};

  if (scripts.build) {
    logging.info(scripts.build);
  } else {
    // TODO: download requirements
    async.waterfall(
      [function(cb) {cb(null, settings)}, compile, distribute],
      function(err, result) {
        logging.end('spm build finished!  ' + '❤'.to.magenta.color);
      }
    );
  }
};


function compile(settings, callback) {
  // start of compiling
  logging.start('Start Compiling');
  var files = pathlib.walkdirSync(settings.inputDirectory);

  var _compilers = settings.compilers || defaultCompilers;

  var q = async.queue(function(task, callback) {
    var TaskCompiler = task.Compiler, filepath = task.filepath;
    var _compiler = new TaskCompiler(filepath, settings);
    logging.debug('[%s]: %s', _compiler.name, filepath.to.magenta.color);
    _compiler.run(callback);
  }, 4);

  files.forEach(function(filepath) {
    _compilers.forEach(function(c) {
      var C = __require(c);
      if (C.prototype.validate(filepath)) {
        q.push({Compiler: C, filepath: filepath}, function(err) {
          if (err) logging.error(err);
        });
      }
    });
  });

  q.drain = function() {
    // end of compiling
    logging.end('compiled files are in %s', settings.buildDirectory || '.spm-build');
    callback(null, settings);
  }
}

function distribute(settings, callback) {
  logging.start('Start Distributing');

  // distribute according to `output`
  //
  // available output:
  //
  //  a.js: '.',
  //  a.js: '*',
  //  a.js: ['a.js', 'b.js', 'c.js']
  //  a.js: 'a.js',
  //  a.css: '.',
  //  a.png: '.',
  //  a/: '.',
  //  a/: 'a/',

  var q = async.queue(function(task, callback) {
    logging.debug('distributing %s', task.key);

    if (/\.js$/.test(task.key)) {
      // distribute js
      distributeJS(settings, task);
    } else if (/\/$/.test(task.key)) {
      // copy whole directory
    } else {
      // copy file
    }

    callback();
  }, 4);

  _.each(settings.output, function(value, key) {
    q.push({key: key, value: value}, function(err) {
      if (err) logging.error(err);
    });
  });

  q.drain = function() {
    logging.end('distributed files are in %s', settings.outputDirectory);
    // delete .spm-build
    callback(null, settings);
  }
}


// helpers
function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color);
  process.exit(1);
}

function distributeJS(settings, task) {
  var key = task.key, value = task.value;
  var buildDirectory = settings.buildDirectory;
  var outputDirectory = settings.outputDirectory;

  var file, data, filepath;
  if (value === '.') {
    file = path.join(buildDirectory, key);
    data = fs.readFileSync(file, settings.encoding || 'utf8') + '\n';
    (dependency.parseDefine(data) || []).forEach(function(dep) {
      if (dep.charAt(0) === '.') {
        filepath = path.join(buildDirectory, dep);
        data += readJsFileSync(filepath, settings.encoding || 'utf8');
      }
    })
  } else if (value === '*') {
    file = path.join(buildDirectory, key);
    data = fs.readFileSync(file, settings.encoding || 'utf8') + '\n';
    (dependency.parseDefine(data) || []).forEach(function(dep) {
      if (dep.charAt(0) === '.') {
        filepath = path.join(buildDirectory, dep);
        data += readJsFileSync(filepath, settings.encoding || 'utf8');
      } else {
        // TODO
      }
    })
  } else {
    data = '';
    if (_.isString(value)) {
      value = [value];
    }
    value.forEach(function(v) {
      filepath = path.join(buildDirectory, v);
      data += readJsFileSync(filepath, settings.encoding || 'utf8');
    });
  }
  pathlib.writeFileSync(path.join(outputDirectory, key), data);
}

function readJsFileSync(filepath, encoding) {
  if (!/\.js$/.test(filepath)) {
    filepath = filepath + '.js';
  }

  if (!fs.existsSync(filepath)) {
    logging.warn('%s not exists', filepath);
    return '';
  }

  return '\n' + fs.readFileSync(filepath, encoding) + '\n';
}
