var path = require('path');
var extname = path.extname;
var log = require('./utils/log');
var install = require('./install');
var umi = require('umi');
var buildArgs = umi.buildArgs;
var standalonify = umi.standalonify;
var plugin = umi.plugin;
var extend = umi.util.extendOption;
var Package = umi.Package;
var concat = umi.concat;
var src = umi.src;
var gulp = require('gulp');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var beautify = require('gulp-beautify');
var zip = require('gulp-zip');
var clean = require('gulp-clean');
var pipe = require('multipipe');

module.exports = function(options, cb) {
  var args = buildArgs(options);
  logArgs(args);

  if (args.install === true) {
    var opt = {
      base: args.cwd
    };
    install(opt, function(err) {
      if (err) return cb(err);
      build(args, cb);
    });
  } else {
    build(args, cb);
  }
};

function build(args, cb) {
  gulp.reset();
  gulp.removeAllListeners();

  // add package info
  try {
    var pkg = new Package(args.cwd, {
      extraDeps: {handlebars: 'handlebars-runtime'}
    });
    log.info('package', 'analyse infomation');
    log.info('package', 'dependencies: ' + Object.keys(pkg.dependencies));
    log.info('package', 'files: ' + Object.keys(pkg.files));
    args.pkg = pkg;
  } catch(err) {
    return cb(err);
  }

  // get build files
  var files = getFiles(pkg);
  log.info('output', 'files: ' + files);

  // define task
  defineCleanTask(args.dest);
  defineBuildTask(files, args);
  defineZipTask(args.dest);

  gulp
  .on('task_start', function(e) {showLog('start', e);})
  .on('task_stop', function(e) {showLog('end', e);})
  .on('task_err', function(e) {cb(e.err);})
  .on('err', function(e) {cb(e.err);});

  var tasks = ['build'];
  if (args.zip) tasks.push('zip');
  tasks.push(cb);

  gulp.start.apply(gulp, tasks);
}

function getFiles(pkg) {
  return [pkg.main]
    .concat(pkg.output)
    .filter(function(item, index, arr) {
      return index === arr.indexOf(item);
    });
}

function defineBuildTask(files, args) {
  var deps = [];
  files.forEach(function(file) {
    var ext = extname(file).substring(1);
    var name = 'build file ' + file;
    if (~['css', 'less', 'sass', 'styl'].indexOf(ext)) {
      gulp.task(name, ['clean'], buildCss(file, args));
      gulp.task(addDebug(name), ['clean'], buildCssDebug(file, args));
    } else {
      gulp.task(name, ['clean'], buildJs(file, args));
      gulp.task(addDebug(name), ['clean'], buildJsDebug(file, args));
    }
    deps.push(name);
    deps.push(addDebug(name));
  });

  gulp.task('build', deps);

  function addDebug(name) {
    return name.replace('.js', '-debug.js');
  }
}

function buildCss(file, options) {
  var dest = getDest(options);
  var opt = extend(options);

  return function() {
    return pipe(
      gulp.src(file, opt),
      gulpif(/\.css$/, plugin.cssParser(opt)),
      cssmin(),
      gulp.dest(dest)
    );
  };
}

function buildCssDebug(file, options) {
  var dest = getDest(options);
  var opt = extend(options);
  opt.rename = {suffix: '-debug'};

  return function() {
    return pipe(
      gulp.src(file, opt),
      gulpif(/\.css$/, plugin.cssParser(opt)),
      gulp.dest(dest)
    );
  };
}

function buildJs(file, options) {
  var dest = getDest(options);
  var opt = extend(options);

  return function() {
    return pipe(
      src(file, opt),
      gulpif(/\.css$/, plugin.cssParser(opt)),
      gulpif(/\.css$/, cssmin()),
      gulpif(/\.css$/, plugin.css2jsParser(opt)),
      gulpif(/\.tpl$/, plugin.tplParser(opt)),
      gulpif(/\.json$/, plugin.jsonParser(opt)),
      gulpif(/\.handlebars$/, plugin.handlebarsParser(opt)),
      gulpif(/\.js$/, plugin.jsParser(opt)),
      concat(),
      standalonify(options),
      uglify(),
      gulp.dest(dest)
    );
  };
}

function buildJsDebug(file, options) {
  var dest = getDest(options);
  var opt = extend(options);
  opt.rename = {suffix: '-debug'};

  return function() {
    return pipe(
      src(file, opt),
      gulpif(/\.css$/, plugin.cssParser(options)), // 这里不替换 debug
      gulpif(/\.css$/, cssmin()),
      gulpif(/\.css$/, plugin.css2jsParser(opt)),
      gulpif(/\.tpl$/, plugin.tplParser(opt)),
      gulpif(/\.json$/, plugin.jsonParser(opt)),
      gulpif(/\.handlebars$/, plugin.handlebarsParser(opt)),
      gulpif(/\.js$/, plugin.jsParser(opt)),
      concat(),
      standalonify(options),
      beautify({indentSize: 2, preserveNewlines: false}),
      gulp.dest(dest)
    );
  };
}

function defineZipTask(dest) {
  gulp.task('zip', ['build'], function() {
    return pipe(
      gulp.src('**/*', {cwd: dest}),
      zip('archive.zip'),
      gulp.dest(dest)
    );
  });
}

function defineCleanTask(dest) {
  gulp.task('clean', function() {
    return pipe(
      gulp.src(dest),
      clean()
    );
  });
}

function logArgs(args) {
  Object.keys(args)
    .forEach(function(key) {
      log.info('arguments', key + ' = ' + args[key]);
    });
}

function showLog(type, e) {
  var info = 'task ' + e.task;
  if (type === 'end') info = info.to.green.color;
  log.info(type, info);
}

function getDest(opt) {
  var prefix = umi.util.template(opt.idleading, opt.pkg);
  if (opt)
  return path.join(opt.dest, prefix);
}
