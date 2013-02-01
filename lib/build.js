var grunt = require('./sdk/grunt');
var log = require('colorful').logging;

exports.run = function(options) {
  if (options.interupt) {
    log.on('logging-warn', function() {
      process.exit(1);
    });
    log.on('logging-error', function() {
      process.exit(1);
    });
  }
  grunt.spm.init('build', options, function(grunt) {
    var pkg = grunt.file.readJSON('package.json');
    var config = {pkg: pkg};
    config.src = options.inputDirectory || 'src';
    config.dest = options.outputDirectory || 'dist';
    require('grunt-spm-build').init(grunt, config);
    grunt.spm.loadTasks();
    grunt.registerInitTask('build', ['spm-build']);
  });
};
