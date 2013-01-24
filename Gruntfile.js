var exec = require('child_process').exec;

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'lib/**/*.js',
        '!lib/utils/tar.js',
        'bin/*',
        'tests/*.test.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    test: {
      src: ['tests/*.test.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerMultiTask('test', function() {
    var done = this.async();
    var files = this.filesSrc;
    var cmd = 'node_modules/.bin/mocha --reporter dot --colors ';
    exec(cmd + files.join(' '), function(error, stdout, stderr) {
      if (error) {
        grunt.log.error(error);
      }
      grunt.log.writeln(stdout);
      done();
    });
  });

  grunt.registerTask('default', ['jshint']);
};
