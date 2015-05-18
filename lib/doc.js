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
var crequire = require('crequire');
var mkdirp = require('fs-extra').mkdirpSync;
var install = require('./client').install;

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

  getWebpackOpts({cwd:cwd,debug:true,verbose:argv.verbose}, function(err, webpackOpts) {
    var opts = extend(true, {}, webpackOpts, {
      devtool: '#source-map',
      output: {
        library: webpackOpts.pkg.name,
        libraryTarget: 'this',
        path: join(cwd, '_site/dist')
      }
    });

    var testOpts = extend(true, {}, webpackOpts, {
      devtool: '#source-map',
      output: {
        path: join(cwd, '_site/dist')
      },
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

    var pkg = JSON.parse(readFile(join(process.cwd(), 'package.json'), 'utf-8'));
    generateFile(process.cwd(), pkg);

    var main = pkg.spm.main || 'index';
    main = main.replace(/^\.\//, '');
    main = main.replace(/\.js$/, '');
    delete opts.entry[pkg.name + '/' + pkg.version + '/' + main];
    opts.entry['./bundle'] = join(process.cwd(), './_site/_bundle.js');

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
    }, function(err) {
      if (err) {
        log.error('exit', err.message);
        console.log();
        process.exit(1);
      }

      buildPackage(opts, function() {
        console.log();
        buildPackage(testOpts, function() {
          console.log();
          nico.server(argv, callback);
        });
      });
    });

  });
}

function buildPackage(opts, callback) {
  var compiler = webpack(opts);
  compiler.plugin('compile', function() {
    log.info('build', 'compile');
  });
  compiler.plugin('invalid', function() {
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

function getDeps(file) {
  var ret = [];

  if (Array.isArray(file)) {
    file.forEach(function(f) {
      ret = ret.concat(getDeps(f));
    });
    return ret;
  }

  var content = readFile(file, 'utf-8');
  var re = /````javascript([\s\S]+?)````/gm;
  var m;
  while((m = re.exec(content)) !== null) {
    crequire(m[1]).forEach(function(item) {
      ret.push(item.path);
    });
  }
  return ret;
}

function generateFile(cwd, pkg) {
  if (!pkg) {
    pkg = JSON.parse(readFile(join(cwd, 'package.json'), 'utf-8'));
  }

  var files = glob.sync('**/*.md', {
    cwd: cwd
  });
  files = files.filter(function(file) {
    return file.indexOf('spm_modules') === -1;
  });
  files = files.map(function(file) {
    return join(cwd, file);
  });

  var deps = getDeps(files);
  var main = pkg.spm.main || 'index';
  main = main.replace(/^\.\//, '');

  var code = [];
  if (exists(join(cwd, main)) || exists(join(cwd, main + '.js'))) {
    code = ['module.exports = require(\'../' + main + '\')'];
  }

  deps.forEach(function(dep) {
    if (dep === pkg.name) return;
    code.push('window[\''+dep+'\'] = require(\''+dep+'\');');
  });

  mkdirp(join(cwd, '_site'));
  writeFile(join(cwd, '_site/_bundle.js'), code.join('\n'));
}

