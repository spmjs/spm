var grunt = require('grunt');
var path = require('path');
var color = require('colorful').color;
var log = require('colorful').logging;

// reset grunt log
/*
grunt.log.verbose.ok = function(msg) {
  log.debug(msg, color.green('OK'));
};

grunt.log.verbose.success = function(msg) {
  log.debug(msg, color.green('Success'));
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
*/


// extend grunt
grunt.file.writeJSON = function(filepath, contents, options) {
  grunt.file.write(filepath, JSON.stringify(contents), options);
};


grunt.spm = {};

// load all spm tasks and its plugins' tasks
grunt.spm.loadTasks = function(tasks) {
  var NODE_PATH = process.env.NODE_PATH;
  if (!tasks) {
    // load built-in tasks
    // 1. grunt-spm-build
    tasks = [];
    tasks.push(path.dirname(require.resolve('grunt-spm-build')));
    tasks.forEach(function(task) {
      grunt.loadTasks(path.join(task, 'tasks'));
    });
  } else if (NODE_PATH) {
    // load global tasks
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    tasks.forEach(function(task) {
      grunt.loadTasks(path.join(NODE_PATH, task, 'tasks'));
    });
  } else {
    grunt.log.error('Environment variable required: "NODE_PATH"');
    process.exit(1);
  }
};


// command line tool
grunt.spm.init = function(name, options, fn) {
  grunt.option.init(options);

  // 1. find Gruntfile in cwd
  if (grunt.file.exists('Gruntfile.js') && runCli(name, 'Gruntfile.js')) {
    return;
  }
  // 2. find Gruntfile in remote
  // TODO

  // 3. default function
  runCli(name, fn);
};

module.exports = grunt;


// helpers
function runCli(name, gruntfile) {
  var fn;
  if (typeof gruntfile === 'function') {
    fn = gruntfile;
  } else {
    fn = require(path.resolve(gruntfile));
  }
  if (typeof fn === 'function') {
    fn.call(grunt, grunt);
    if (grunt.task._tasks[name]) {
      grunt.option('gruntfile', gruntfile);
      grunt.option('base', process.cwd());

      grunt.task.init([name]);
      grunt.task.run(name);
      grunt.task.start();
      return true;
    }
  }
  return false;
}
