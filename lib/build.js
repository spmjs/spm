var fs = require('fs');
var path = require('path');
var extname = path.extname;
var glob = require('glob');
var log = require('./utils/log');
var install = require('./install');
var umi = require('umi');
var gulp = require('gulp');
var multipipe = require('multipipe');
var $ = require('gulp-load-plugins')({
  config: require('../package.json')
});

module.exports = function(options, cb) {
  var args = umi.buildArgs(options);
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
  // add package info
  try {
    var pkg = new umi.Package(args.cwd, {
      skip: args.skip || []
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

  // check duplicate pkgs
  files.forEach(function(f) {
    checkDuplicate(pkg.files[f], pkg.name);
  });

  // define task
  defineCleanTask(args.dest, args);
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
  var files = [];

  if (fs.existsSync(path.join(pkg.dest, pkg.main))) {
    files.push(pkg.main);
  }

  if (Array.isArray(pkg.output) && pkg.output.length) {
    pkg.output.forEach(function (outputGlob) {
      var items = glob.sync(outputGlob, {cwd: pkg.dest});
      files = files.concat(items);
    });
  }

  return files
    .filter(function(item, index, arr) {
      return index === arr.indexOf(item);
    });
}

function defineBuildTask(files, args) {
  gulp.task('build', ['clean'], buildFiles(files, args));
}

function buildFiles(files, args) {
  var dest = getDest(args);
  var beautifyOpt = {indent_size: 2, preserve_newlines: false};

  var isStandalone = args.include === 'standalone';
  if (isStandalone) {
    args.include = 'all';
  }
  
  var opt = umi.util.extendOption(args);
  var optDebug = umi.util.extendOption(args);
  optDebug.rename = {'suffix': '-debug'};

  return function() {
    return pipe(
      gulp.src(files, {cwd:opt.cwd,base:opt.cwd}),
      $.if(isCSSorJS, $.mirror(
        pipe(
          $.transport(opt),
          $.if(isJS, pipe(
            $.if(isStandalone, umi.standalonify(args)),
            $.uglify()
          ), $.cssmin())
        ),
        pipe(
          $.transport(optDebug),
          $.if(isJS, pipe(
            $.if(isStandalone, umi.standalonify(args)),
            $.jsbeautify(beautifyOpt)
          ))
        )
      )),
      gulp.dest(dest)
    );
  };

  function isJS(file) {
    return extname(file.path) === '.js';
  }
  function isCSSorJS(file) {
    var ext = extname(file.path).slice(1);
    return ['css', 'js'].indexOf(ext) > -1;
  }
}

function defineZipTask(dest) {
  gulp.task('zip', ['build'], function() {
    return pipe(
      gulp.src('**/*', {cwd: dest}),
      $.zip('archive.zip'),
      gulp.dest(dest)
    );
  });
}

function defineCleanTask(dest, args) {
  if (args.force) {
    gulp.task('clean', function() {
      return pipe(
        gulp.src(dest),
        $.clean({force: true})
      );
    });
  } else {
    gulp.task('clean');
  }
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

function pipe() {
  return multipipe.apply(null, arguments)
    .on('data', function() {});
}

function checkDuplicate(file, rootPkgName) {
  var dup = {};

  file.lookup(function(fileInfo) {
    var name = fileInfo.pkg.name;
    var version = fileInfo.pkg.version;
    if (name === rootPkgName) return;
    dup[name] = dup[name] || {};
    dup[name][version] = true;
  });

  for (var k in dup) {
    var versions = Object.keys(dup[k]);
    if (versions.length > 1) {
      log.warn('dulplicate',
        'version %s of package %s have been required while building %s'.to.yellow.color,
        versions.join(', '),
        k,
        file.filepath
      );
    }
  }
}


