var fs = require('fs-extra');
var path = require('path');
var util = require('util');
var child_process = require('child_process');
require('colorful').colorful();
var logging = require('colorful').logging;
var _ = require('underscore');
var async = require('async');
var compiler = require('./sdk/compiler');
var compressor = require('./sdk/compressor');
var module = require('./sdk/module');
var ast = require('./sdk/ast');
var __require = require('./utils').require;
var childexec = require('./utils').childexec;
var pathlib = require('./utils/pathlib');

var defaultCompilers = [
  compiler.BaseCompiler, compiler.JSCompiler, compiler.JCSSCompiler,
  compiler.JtplCompiler
];
var defaultCompressors = [compressor.UglifyCompressor];


exports.run = function(commander) {
  if (commander.interrupt) {
    logging.once('logging-warn', interrupt);
    logging.once('logging-error', interrupt);
  }
  logging.start('spm build');

  logging.debug('parse command line options');
  var settings = module.parseOptions(commander);
  // TODO: download requirements

  var scripts = settings.scripts || {};

  var runbuild = function(callback) {
    if (scripts.build) {
      childexec(scripts.build, function(err) {
        logging.end('spm build finished!  ' + '❤'.to.magenta.color);
      });
    } else {
      async.waterfall(
        [function(cb) {cb(null, settings)}, compile, distribute, compress],
        function(err, result) {
          logging.end('spm build finished!  ' + '❤'.to.magenta.color);
        }
      );
    }
  };


  if (scripts.prebuild) {
    childexec(scripts.prebuild, function(err) {
      runbuild(settings);
    });
  } else {
    runbuild(settings);
  }
};


function compile(settings, callback) {
  // start of compiling
  logging.start('Start Compiling');
  var files = pathlib.walkdirSync(settings.source);

  var _compilers = settings.compilers || defaultCompilers;

  var q = async.queue(function(task, callback) {
    var TaskCompiler = task.Compiler, filepath = task.filepath;
    var _compiler = new TaskCompiler(filepath, settings);
    logging.debug('[%s]: %s', _compiler.name, filepath.to.magenta.color);
    _compiler.run(callback);
  }, 4);

  var hasCompiler;
  files.forEach(function(filepath) {
    hasCompiler = false;
    _compilers.forEach(function(c) {
      var C = __require(c);
      if (C.prototype.validate(filepath)) {
        hasCompiler = true;
        q.push({Compiler: C, filepath: filepath}, function(err) {
          if (err) logging.error(err);
        });
      }
    });
    if (!hasCompiler) {
      q.push({Compiler: compiler.CopyCompiler, filepath: filepath}, function(err) {
        if (err && !_.isEmpty(err)) logging.error(err);
      });
    }
  });

  q.drain = function() {
    // end of compiling
    logging.end('compiled files are in %s', settings.builddir || '.spm-build');
    callback(null, settings);
  };
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
    var key = task.key, value = task.value;
    logging.debug('distributing %s', key);

    if (/\.js$/.test(task.key)) {
      // distribute js
      distributeJS(settings, task);
      callback();
    } else {
      key = key.replace(/\/$/, '');
      if (value === '.') value = key;
      value = value.replace(/\/$/, '');
      if (!fs.existsSync(settings.destination)) {
        fs.mkdirsSync(settings.destination);
      }
      fs.copy(
        path.join(settings.builddir, value),
        path.join(settings.destination, key), callback
      );
    }
  }, 4);

  _.each(settings.output, function(value, key) {
    q.push({key: key, value: value}, function(err) {
      if (err && !_.isEmpty(err)) logging.error(err);
    });
  });

  q.drain = function() {
    // clean build directory
    fs.deleteSync(settings.builddir);
    logging.end('distributed files are in %s', settings.destination);
    callback(null, settings);
  };
}

function compress(settings, callback) {
  logging.start('Start Compressing');

  var _compressors = settings.compressors || defaultCompressors;

  var q = async.queue(function(task, callback) {
    var TaskCompressor = task.Compressor, filepath = task.filepath;
    var _compressor = new TaskCompressor(filepath, settings);
    logging.debug('[%s]: %s', _compressor.name, filepath.to.magenta.color);
    _compressor.run(callback);
  }, 4);

  var files = Object.keys(settings.output), filepath;
  files.forEach(function(filename) {
    filepath = path.join(settings.destination, filename);
    _compressors.forEach(function(c) {
      var C = __require(c);
      if (C.prototype.validate(filepath)) {
        q.push({Compressor: C, filepath: filepath}, function(err) {
          if (err) logging.error(err);
        });
      }
    });
  });

  q.drain = function() {
    logging.end('compress files finished');
    callback(null, settings);
  };
}


// helpers
function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color);
  process.exit(1);
}

function distributeJS(settings, task) {
  var key = task.key, value = task.value;
  var builddir = settings.builddir;
  var destination = settings.destination;

  var parseData = function(data, isAll) {
    var rets = ast.parseDefines(data);
    var deps = [], filepath;

    rets.forEach(function(ret) {
      ret.dependencies.forEach(function(dep) {
        if (dep.charAt(0) === '.' && !_.contains(deps, dep)) {
          filepath = path.join(builddir, dep);
          data += readJsFileSync(filepath, settings.encoding || 'utf8');
          deps.push(dep);
        } else if (isAll) {
          // TODO
          deps.push(dep);
        }
      });
    });
    return data;
  };

  var file, data, filepath;
  if (value === '.') {
    file = path.join(builddir, key);
    data = fs.readFileSync(file, settings.encoding || 'utf8');
    data = parseData(data);
  } else if (value === '*') {
    file = path.join(builddir, key);
    data = fs.readFileSync(file, settings.encoding || 'utf8');
    data = parseData(data, true);
  } else {
    data = '';
    if (_.isString(value)) {
      value = [value];
    }
    value.forEach(function(v) {
      filepath = path.join(builddir, v);
      data += readJsFileSync(filepath, settings.encoding || 'utf8');
    });
  }
  pathlib.writeFileSync(path.join(destination, key), data);
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
