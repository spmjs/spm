var fs = require('fs');
var grunt = require('grunt');
var path = require('path');
var request = require('request');
var color = require('colorful').color;
var log = require('../utils/log');
var spmrc = require('./spmrc');

// reset grunt log
function logCategory(bits) {
  return bits[0].toLowerCase().replace(/:$/, '');
}
grunt.log.header = function(msg) {
  msg = msg || '';
  if (/^Running/.test(msg)) {
    log.debug('running', msg.replace(/^Running\s*/, ''));
  }
};
grunt.log.verbose.header = function() {};
grunt.log.verbose.subhead = function() {};

grunt.log.write = function(msg) {
  if (!msg) return grunt.log;
  var bits = msg.split(' ');
  log.info(logCategory(bits), bits.slice(1).join(' '));
  return grunt.log;
};
grunt.log.verbose.write = function(msg) {
  if (!msg) return grunt.log;
  var bits = msg.split(' ');
  if (bits[0].length < 2) return grunt.log;
  log.debug(logCategory(bits), bits.slice(1).join(' '));
  return grunt.log;
};

grunt.log.writeln = function(msg) {
  if (!msg) return grunt.log;
  var bits = msg.split(' ');
  log.info(logCategory(bits), bits.slice(1).join(' '));
  return grunt.log;
};
grunt.log.verbose.writeln = function(msg) {
  if (!msg) return grunt.log;
  var bits = msg.split(' ');
  if (bits[0].length < 2) return grunt.log;
  log.debug(logCategory(bits), bits.slice(1).join(' '));
  return grunt.log;
};

grunt.log.ok = function(msg) {
  msg && log.info('ok', msg || '');
  return grunt.log;
};
grunt.log.verbose.ok = function(msg) {
  msg && log.debug('ok', msg || '');
  return grunt.log;
};

grunt.log.verbose.success = function(msg) {
  log.debug('success', msg || '');
  return grunt.log;
};
grunt.log.verbose.warn = function(msg) {
  log.debug('warn', msg || '');
  return grunt.log;
};
grunt.log.verbose.error = function(msg) {
  log.debug('error', msg || '');
  return grunt.log;
};


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
grunt.spm.getGruntfiles = function(callback) {
  var files = [];
  if (grunt.file.exists('Gruntfile.js')) {
    files.push('Gruntfile.js');
  }
  var gruntfile = spmrc.get('user.gruntfile');
  if (!gruntfile) {
    callback(files);
    return;
  }
  log.debug('gruntfile', gruntfile);
  if (/^https?/.test(gruntfile)) {
    download(gruntfile, function(err, fpath) {
      if (!err) {
        files.push(fpath);
      } else {
        log.warn('error', gruntfile);
      }
      callback(files);
    });
  } else {
    files.push(gruntfile);
    callback(files);
  }
};
grunt.spm.init = function(name, options, fn) {
  grunt.option.init(options);

  grunt.spm.getGruntfiles(function(files) {
    files.push(fn);
    files.some(function(gruntfile) {
      return runCli(name, gruntfile);
    });
  });
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
      grunt.task.options({'done': function() {
        log.info('success', 'build finished.');
        console.log();
      }});
      grunt.task.run(name);
      grunt.task.start();
      return true;
    }
  }
  return false;
}

function download(url, callback) {
  var fpath = path.join(process.env.TMPDIR, encodeURIComponent(url));
  var isExpired = function(fpath) {
    if (!grunt.file.exists(fpath)) return true;
    // default expires in 1 day
    var expires = spmrc.get('user.expires') || 86400000;
    return (new Date() - fs.statSync(fpath).ctime) > parseInt(expires, 10);
  };
  if (!isExpired(fpath)) {
    callback(null, fpath);
  } else {
    request.get(url, function(err, response, body) {
      if (err) {
        callback(err);
      } else if (response.statusCode !== 200) {
        callback(response.statusCode);
      } else {
        grunt.file.write(fpath, body);
        callback(null, fpath);
      }
    });
  }
}
