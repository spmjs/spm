var grunt = require('./sdk/grunt');

exports.run = function(options) {
  // TODO scripts
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
