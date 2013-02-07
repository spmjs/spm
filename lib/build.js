var grunt = require('./sdk/grunt');

module.exports = function(options) {
  var pkg = grunt.file.readJSON('package.json');
  var scripts = pkg.scripts || {};
  if (scripts.build) {
    childexec(scripts.build, function() {
      log.info('success', 'build finished.');
    });
  } else {
    grunt.spm.init('build', options, function(grunt) {
      var config = {pkg: pkg};
      config.src = options.inputDirectory || 'src';
      config.dest = options.outputDirectory || 'dist';
      require('grunt-spm-build').init(grunt, config);
      grunt.spm.loadTasks();
      grunt.task.options({'done': function() {
        log.info('success', 'build finished.');
        console.log();
      }});
      grunt.registerInitTask('build', ['spm-build']);
    });
  }
};
