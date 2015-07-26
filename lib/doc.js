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
var readFile = require('fs').readFileSync;
var writeFile = require('fs').writeFileSync;
var exists = require('fs').existsSync;
var mkdirp = require('fs-extra').mkdirpSync;
var install = require('./client').install;
var chokidar = require('chokidar');

var sw = require('spm-webpack');
var getWebpackOpts = sw.build.getWebpackOpts;
var webpack = sw.webpack;

module.exports = function(argv, callback) {
  callback = callback || noop;
  if (argv.clean) cleanDoc();
  if (argv.build) return build(argv, callback);
  if (argv.publish) return publish(argv, callback);
  return server(argv, callback);
};

module.exports.build = build;
module.exports.server = server;
module.exports.publish = publish;

function build(argv, callback) {
  argv.watch = false;
  argv.config = getThemePath();
  webpackWrap(argv, function() {
    nico.build(argv);
    callback();
  });
}

function server(argv, callback) {
  argv.watch = true;
  webpackWrap(argv, function() {
    nico.server(argv, callback);
  });
}

function webpackWrap(argv, callback) {
  argv.config = getThemePath();
  argv.port = argv.port || 8000;

  var cwd = process.cwd();

  var pkg = JSON.parse(readFile(join(process.cwd(), 'package.json'), 'utf-8'));

  // don't build main file
  pkg.spm = pkg.spm || {};
  pkg.spm.oldMain = pkg.spm.main;
  pkg.spm.main = '________________';

  generateFile(process.cwd(), pkg);

  getWebpackOpts({cwd:cwd,debug:true,verbose:argv.verbose,pkg:pkg}, function(err, webpackOpts) {
    var opts = extend(true, {}, webpackOpts, {
      devtool: '#source-map',
      output: {
        library: webpackOpts.pkg.name,
        libraryTarget: 'this',
        path: join(cwd, '_site/dist')
      }
    });
    opts.entry['./bundle'] = join(process.cwd(), './_site/_bundle.js');

    var testOpts = extend(true, {}, webpackOpts, {
      devtool: '#source-map',
      output: {
        path: join(cwd, '_site/dist')
      },
      module: {
        postLoaders: argv.cov ? [{
          test: /\.js$/,
          exclude: /(test|tests|spm_modules|node_modules)\//,
          loader: 'istanbul-instrumenter'
        }] : []
      },
      resolveLoader: {
        modulesDirectories: ['node_modules', join(__dirname, '../node_modules')]
      },
      externals: {
        'sinon': 'sinon'
      }
    });
    testOpts.entry = {
      'test': getSpecFiles(webpackOpts.pkg)
    };

    // Install devDependencies
    // Get deps to install.
    var query = [];
    if (pkg && pkg.spm && pkg.spm.devDependencies) {
      for (var k in pkg.spm.devDependencies) {
        query.push(k+'@'+pkg.spm.devDependencies[k]);
      }
    }

    install({
      name: query,
      cwd: cwd,
      registry: pkg && pkg.spm && pkg.spm.registry
    }).then(function() {
      buildPackage(opts, argv.watch, function() {
        console.log();
        buildPackage(testOpts, argv.watch, function() {
          console.log();
          callback();
          copyHtmls();
        });
      });
    }, function(err) {
      log.error('exit', err.message);
      console.log();
      process.exit(1);
    });

  });
}

function buildPackage(opts, isWatch, callback) {
  var compiler = webpack(opts);
  compiler.plugin('compile', function() {
    log.info('build', 'compile');
  });
  compiler.plugin('done', function(stats) {
    printResult(stats);
    log.info('build', 'done');

    if (callback) {
      callback();
    }
    callback = null;
  });
  if (isWatch) {
    compiler.watch(200, function (err) {
      if (err) throw err;
    });
  } else {
    compiler.run(function(err) {
      if (err) throw err;
    });
  }
}

function printResult(stats) {
  log.debug('stats', '\n' + stats.toString());

  var errors = stats.compilation.errors;
  if (errors && errors.length) {
    errors.forEach(function (err) {
      log.error('error', err.message);
    });
  }

  stats = stats.toJson();
  stats.assets.forEach(function(item) {
    var size = (item.size/1024.0).toFixed(2) + 'kB';
    log.info('generated', item.name, size.to.magenta.color);
  });
}

function publish(argv, callback) {
  build(argv, function() {
    var pkg = readJSON('package.json');
    var registry;
    if (pkg && pkg.spm) {
      registry = pkg.spm.registry;
    }
    upload({
      doc: DOC_PATH,
      registry: argv.registry || registry
    }, callback);
  });
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

function getDeps(file) {
  var ret = [];

  if (Array.isArray(file)) {
    file.forEach(function(f) {
      ret = ret.concat(getDeps(f));
    });
    return require('uniq')(ret);
  }

  return require('./utils/deps').getDeps(file);
}

function isRelative(file) {
  return file.charAt(0) === '.';
}

function generateCode(cwd, pkg) {
  var files = require('glob').sync('**/*.*(md|htm|html)', {
    ignore: ['_site/**', 'spm_modules/**', 'node_modules/**'],
    cwd: cwd
  });

  var deps = getDeps(files);
  log.info('deps', deps.join(', '));
  var main = pkg.spm.oldMain || 'index';
  main = main.replace(/^\.\//, '');

  var code = [];
  if (exists(join(cwd, main)) || exists(join(cwd, main + '.js'))) {
    code = ['module.exports = require(\'../' + main + '\')'];
  }

  deps.forEach(function(dep) {
    if (dep === pkg.name) return;
    var rDep = dep;
    if (isRelative(rDep)) {
      rDep = path.relative('./_site/', rDep);
      if (rDep.charAt(0) !== '.') {
        rDep = './' + rDep;
      }
    }
    code.push('window[\''+dep+'\'] = require(\''+rDep+'\');');
  });

  return code.join('\n');
}

function generateFile(cwd, pkg) {
  var code;

  chokidar.watch('**/*.(md|html)', {
    ignored: /(spm_modules|node_modules|_site)/
  }).on('change', function(filepath) {
    log.info('watch', filepath);
    g();
    if (path.extname(filepath) === '.html') {
      copyHtml(filepath);
    }
  });

  g();

  function g() {
    var newCode = generateCode(cwd, pkg);
    if (newCode === code) return;

    if (code) {
      log.info('deps changed');
    }
    if (!code) {
      mkdirp(join(cwd, '_site'));
    }
    writeFile(join(cwd, '_site/_bundle.js'), newCode);
    log.info('generate', '_site/_bundle.js');
    code = newCode;
  }
}

function copyHtml(file) {
  log.info('copy html', file);
  var vfs = require('vinyl-fs');
  var through = require('through2');
  vfs.src(file)
    .pipe(through.obj(function(f, enc, cb) {
      f.contents = new Buffer(require('./utils/deps').replaceDeps(f.contents, file));
      cb(null, f);
    }))
    .pipe(vfs.dest('./_site/'));
}

function copyHtmls() {
  var vfs = require('vinyl-fs');
  var through = require('through2');
  vfs.src(['./**/*.html', '!./_site/**/*.html', '!./spm_modules/**/*.html', '!./node_modules/**/*.html'])
    .pipe(through.obj(function(f, enc, cb) {
      f.contents = new Buffer(require('./utils/deps').replaceDeps(f.contents, f.relative));
      this.push(f);
      cb();
    }))
    .pipe(vfs.dest('./_site/'));
}
