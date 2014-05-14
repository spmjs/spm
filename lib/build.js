var path = require('path');
var extname = path.extname;
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
var pipe = require('multipipe');

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
  log.info('output', 'files: ' + files);

  // build
  defineBuildTask(files, args);

  gulp
  .on('task_start', function(e) {
    showLog('start', e);
  })
  .on('task_stop', function(e) {
    showLog('end', e);
  })
  .on('task_err', function(e) {
    console.log('err');
    console.log(e);
  })
  .start(['build'], cb);
};

function getFiles(pkg) {
  return [pkg.main]
    .concat(pkg.output)
    .filter(function(item, index, arr) {
      return index === arr.indexOf(item);
    });
}

function defineBuildTask(files, args) {
  var deps = [];
  files.forEach(function(file, index) {
    var ext = extname(file).substring(1);
    var id = 'build' + index + ':' + ext + ':' + file;
    if (~['css', 'less', 'sass', 'styl'].indexOf(ext)) {
      gulp.task(id, buildCss(file, args));
      gulp.task(addDebug(id), buildCssDebug(file, args));
    } else {
      gulp.task(id, buildJs(file, args));
      gulp.task(addDebug(id), buildJsDebug(file, args));
    }
    deps.push(id);
    deps.push(addDebug(id));
  });

  gulp.task('build', deps);

  function addDebug(id) {
    return id.replace('.js', '-debug.js');
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
      gulpif(/\.css$/, plugin.css2jsParser(opt)),
      gulpif(/\.tpl$/, plugin.tplParser(opt)),
      gulpif(/\.json$/, plugin.jsonParser(opt)),
      gulpif(/\.handlebars$/, plugin.handlebarsParser(opt)),
      gulpif(/\.js$/, plugin.jsParser(opt)),
      concat(),
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
      gulpif(/\.css$/, plugin.css2jsParser(opt)),
      gulpif(/\.tpl$/, plugin.tplParser(opt)),
      gulpif(/\.json$/, plugin.jsonParser(opt)),
      gulpif(/\.handlebars$/, plugin.handlebarsParser(opt)),
      gulpif(/\.js$/, plugin.jsParser(opt)),
      concat(),
      beautify({indentSize: 2}),
      gulp.dest(dest)
    );
  };
}

function logArgs(args) {
  Object.keys(args)
    .forEach(function(key) {
      log.info('arguments', key + ' = ' + args[key]);
    });
}

function showLog(type, e) {
  if (!~e.task.indexOf(':')) return;

  var info = 'build file ' + e.task.split(':').pop();
  if (type === 'end') info = info.to.green.color;

  var time = e.duration ?
    (' (' + Math.floor(e.duration * 1000) + 'ms)').to.gray.color : '';

  log.info(type, info + time);
}

function showDiff(time) {
  var diff = Date.now() - time;
  return (' (' + diff + 'ms)').to.gray.color;
}


function getDest(opt) {
  var prefix = umi.util.template(opt.idleading, opt.pkg);
  return path.join(opt.dest, prefix);
}
