var path = require('path');
var extname = path.extname;
var EventProxy = require('eventproxy');
var log = require('../lib/utils/log');
var umi = require('umi');
var buildArgs = umi.buildArgs;
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

module.exports = function build(options, cb) {
  var begin = Date.now();
  var args = buildArgs(options);
  logArgs(args);

  // add package info
  try {
    var pkg = new Package(args.cwd, {
      extraDeps: {handlebars: 'handlebars'}
    });
    log.info('package', 'analyse infomation ' + showDiff(begin));
    log.info('package', 'dependencies: ' + Object.keys(pkg.dependencies));
    log.info('package', 'files: ' + Object.keys(pkg.files));
    args.pkg = pkg;
  } catch(err) {
    return cb(err);
  }

  // get build files
  var files = getFiles(pkg);

  // build
  buildFile(files, args, cb);
};

function getFiles(pkg) {
  var output = [];

  if (pkg.spm && Array.isArray(pkg.spm.output)) {
    output = output.concat(pkg.spm.output);
  }

  output.push(pkg.main || 'index.js');

  return output
    .filter(function(item, index, arr) {
      return index === arr.indexOf(item);
    });
}

function buildFile(files, args, cb) {
  var ep = new EventProxy();
  ep.after('build', files.length, function() {
    cb();
  });
  ep.bind('error', cb);

  files.forEach(function(file) {
    var begin = Date.now();
    log.info('begin', 'build file ' + file);
    var ext = extname(file).substring(1);
    if (~['css', 'less', 'sass', 'styl'].indexOf(ext)) {
      buildCss(file, args, done);
    } else {
      buildJs(file, args, done);
    }

    function done(err) {
      if (err) return ep.emit('error', err);
      log.info('end', ('build file ' + file + showDiff(begin)).to.green.color);
      ep.emit('build');
    }
  });
}

function buildCss(file, options, cb) {
  var ep = new EventProxy();
  ep.all(['file', 'debugFile'], cb);

  var opt = extend(options);
  gulp.src(file, opt)
    .once('error', cb)
    .pipe(gulpif(/\.css$/, plugin.cssParser(opt)))
    .once('error', cb)
    .pipe(cssmin())
    .once('error', cb)
    .pipe(gulp.dest(opt.dest))
    .on('end', function() {
      ep.emit('file');
    });

  //debug file
  var optDebug = extend(options);
  optDebug.rename = {suffix: '-debug'};
  gulp.src(file, optDebug)
    .once('error', cb)
    .pipe(gulpif(/\.css$/, plugin.cssParser(optDebug)))
    .once('error', cb)
    .pipe(gulp.dest(optDebug.dest))
    .on('end', function() {
      ep.emit('debugFile');
    });
}

function buildJs(file, options, cb) {
  var ep = new EventProxy();
  ep.all(['file', 'debugFile'], cb);

  var opt = extend(options);
  src(file, opt)
    .pipe(gulpif(/\.css$/, plugin.cssParser(opt)))
    .once('error', cb)
    .pipe(gulpif(/\.css$/, plugin.css2jsParser(opt)))
    .once('error', cb)
    .pipe(gulpif(/\.tpl$/, plugin.tplParser(opt)))
    .once('error', cb)
    .pipe(gulpif(/\.json$/, plugin.jsonParser(opt)))
    .once('error', cb)
    .pipe(gulpif(/\.handlebars$/, plugin.handlebarsParser(opt)))
    .once('error', cb)
    .pipe(gulpif(/\.js$/, plugin.jsParser(opt)))
    .once('error', cb)
    .pipe(concat())
    .once('error', cb)
    .pipe(uglify())
    .once('error', cb)
    .pipe(gulp.dest(opt.dest))
    .on('end', function() {
      ep.emit('file');
    });

  //debug file
  var optDebug = extend(options);
  optDebug.rename = {suffix: '-debug'};
  src(file, optDebug)
    .pipe(gulpif(/\.css$/, plugin.cssParser(opt))) // 这里不替换 debug
    .once('error', cb)
    .pipe(gulpif(/\.css$/, plugin.css2jsParser(optDebug)))
    .once('error', cb)
    .pipe(gulpif(/\.tpl$/, plugin.tplParser(optDebug)))
    .once('error', cb)
    .pipe(gulpif(/\.json$/, plugin.jsonParser(optDebug)))
    .once('error', cb)
    .pipe(gulpif(/\.handlebars$/, plugin.handlebarsParser(optDebug)))
    .once('error', cb)
    .pipe(gulpif(/\.js$/, plugin.jsParser(optDebug)))
    .once('error', cb)
    .pipe(concat())
    .once('error', cb)
    .pipe(beautify({indentSize: 2}))
    .once('error', cb)
    .pipe(gulp.dest(optDebug.dest))
    .on('end', function() {
      ep.emit('debugFile');
    });
}

function logArgs(args) {
  Object.keys(args)
    .forEach(function(key) {
      log.info('arguments', key + ' = ' + args[key]);
    });
}

function showDiff(time) {
  var diff = Date.now() - time;
  return (' (' + diff + 'ms)').to.gray.color;
}
