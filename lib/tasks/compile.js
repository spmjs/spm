/* grunt compile */


module.exports = function(grunt) {
  grunt.registerMultiTask('compile-js', 'Compile JavaScript', function() {
    var options = this.options({
      src: 'src/*.js',
      dest: '.spm-compiled'
    });
  });
};
