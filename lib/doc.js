require('colorful').colorful();

var path = require('path');
var join = path.join;
var rimraf = require('rimraf').sync;
var nico = require('nico-spm');
var spmrc = require('spmrc');
var log = require('spm-log');
var readJSON = require('fs-extra').readJSONSync;
var extend = require('extend');
var upload = require('./upload');
var DOC_PATH = '_site';
var glob = nico.sdk.file.glob;

var sw = require('spm-webpack');
var getWebpackOpts = sw.build.getWebpackOpts;
var webpack = sw.webpack;

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

  var cwd = process.cwd();

  log.warn('start webpack');
  getWebpackOpts({cwd:cwd,debug:true,verbose:true}, function(err, webpackOpts) {
    webpackOpts.output.path = join(cwd, '_site/dist');

    var opts = extend(true, {}, webpackOpts, {
      devtool: '#eval',
      output: {
        library: webpackOpts.pkg.name,
        libraryTarget: 'this'
      }
    });

    var testOpts = extend(true, {}, webpackOpts, {
      resolveLoader: {
        modulesDirectories: [join(__dirname, '../node_modules')]
      },
      module: {
        postLoaders: [{
          test: /\.js$/,
          exclude: /(test|tests|spm_modules|node_modules)\//,
          loader: 'istanbul-instrumenter'
        }]
      },
      externals: {
        'sinon': 'sinon'
      }
    });
    testOpts.entry = {
      'test': getSpecFiles(webpackOpts.pkg)
    };

    buildPackage(opts, function() {
      console.log();
      buildPackage(testOpts, function() {
        console.log();
        nico.server(argv, callback);
      });
    });

  });
}

function buildPackage(opts, callback) {
  var compiler = webpack(opts);
  compiler.plugin('compile', function(stats) {
    log.info('build', 'compile');
  });
  compiler.plugin('invalid', function(stats) {
    log.info('build', 'invalid');
  });
  compiler.plugin('done', function(stats) {
    printResult(stats);
    log.info('build', 'done');

    if (callback) {
      callback();
    }
    callback = null;
  });
  compiler.watch(200, function(err) {
    if(err) throw err;
  });
  //compiler.run(function(err) {
  //  if(err) throw err;
  //});
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

function getSpecFiles(pkg) {
  var spec = pkg.spm.tests || 'tests/**/*-spec.js';
  var ret = glob.sync(path.join(process.cwd(), spec));
  return ret.map(function(item) {
    return './' + path.relative(process.cwd(), item);
  }).filter(function(item) {
    return item.indexOf('_site') < 0;
  });
}

function winPath(path) {
  return path.replace(/\\/g, '/');
}
