var path = require('path');
var spmrc = require('spmrc');
var grunt = require('./sdk/grunt');
var log = require('./utils/log');

exports = module.exports = function(options) {
  options = options || {};
  var pkgfile = options.pkgfile || 'package.json';
  var pkg = {};
  if (grunt.file.exists(pkgfile)) {
    pkg = grunt.file.readJSON('package.json');
  }

  var installpath = spmrc.get('install.path');
  options.paths = [installpath];
  if (installpath !== 'sea-modules') {
    options.paths.push('sea-modules');
  }
  process.on('log.warn', function(msg) {
    log.warn('warn', msg);
  });
  process.on('log.info', function(msg) {
    log.info('info', msg);
  });

  var scripts = pkg.scripts || {};
  if (scripts.build) {
    childexec(scripts.build, function() {
      log.info('success', 'build finished.');
    });
  } else {
    grunt.invokeTask('build', options, function(grunt) {
      exports.loadBuildTasks(options, pkg);
      grunt.task.options({'done': function() {
        log.info('success', 'build finished.');
      }});
      grunt.registerInitTask('build', ['spm-build']);
    });
  }
};

exports.loadBuildTasks = function(options, pkg) {
  log.info('load', 'grunt-spm-build');
  options = options || {};
  pkg = pkg || grunt.file.readJSON('package.json');

  var config = {pkg: pkg};
  config.src = options.inputDirectory || 'src';
  config.dest = options.outputDirectory || 'dist';

  require('grunt-spm-build').initConfig(grunt, config);
  var rootdir = path.dirname(require.resolve('grunt-spm-build'));
  var data = grunt.file.readJSON(path.join(rootdir, 'package.json'));
  Object.keys(data.dependencies).forEach(function(name) {
      var taskdir = path.join(rootdir, 'node_modules', name, 'tasks');
      if (grunt.file.exists(taskdir)) {
        grunt.loadTasks(taskdir);
      }
  });
};
