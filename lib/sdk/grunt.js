var grunt = require('grunt');
var color = require('colorful').color;
var log = require('colorful').logging;

// reset grunt log
grunt.log.verbose.ok = grunt.log.verbose.success = function(msg) {
  log.debug(color.green(msg));
};

grunt.log.verbose.warn = function(msg) {
  log.debug(color.yellow(msg));
};

grunt.log.verbose.error = function(msg) {
  log.debug(color.red(msg));
};

grunt.log.verbose.writeln = function(msg) {
  log.debug(msg);
};


// extend grunt
grunt.file.writeJSON = function(filepath, contents, options) {
  grunt.file.write(filepath, JSON.stringify(contents), options);
};


// load all spm tasks and its plugins' tasks
grunt.loadSpmTasks = function() {
};


// command line tool
grunt.spmCli = function() {
};

module.exports = grunt;
