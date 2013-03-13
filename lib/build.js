var path = require('path');
var grunt = require('./sdk/grunt');
var log = require('./utils/log');

exports = module.exports = function(options) {
  var pkg = grunt.file.readJSON('package.json');
  var scripts = pkg.scripts || {};
  if (scripts.build) {
    childexec(scripts.build, function() {
      log.info('success', 'build finished.');
    });
  } else {
    grunt.initTask('build', options, function(grunt) {
      exports.loadBuildTasks(options, pkg);
      grunt.task.options({'done': function() {
        log.info('success', 'build finished.');
        console.log();
      }});
      grunt.registerInitTask('build', ['spm-build']);
    });
  }
};

exports.loadBuildTasks = function(options, pkg) {
  options = options || {};
  pkg = pkg || grunt.file.readJSON('package.json');

  var config = {pkg: pkg};
  config.src = options.inputDirectory || 'src';
  config.dest = options.outputDirectory || 'dist';

  require('grunt-spm-build')(grunt, config);
  var rootdir = path.dirname(require.resolve('grunt-spm-build'));
  var data = grunt.file.readJSON(path.join(rootdir, 'package.json'));
  Object.keys(data.dependencies).forEach(function(name) {
      var taskdir = path.join(rootdir, 'node_modules', name, 'tasks');
      if (grunt.file.exists(taskdir)) {
        grunt.loadTasks(taskdir);
      }
  });
};
