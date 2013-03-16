var fs = require('fs');
var grunt = require('grunt');
var path = require('path');
var request = require('request');
var color = require('colorful').color;
var log = require('../utils/log');
var spmrc = require('spmrc');

// reset grunt log
function logCategory(bits) {
  return bits[0].toLowerCase().replace(/:$/, '');
}
grunt.log.header = function(msg) {
  msg = msg || '';
  if (/^Running/.test(msg)) {
    log.debug('running', msg.replace(/^Running\s*/, ''));
  }
  return grunt.log;
};
grunt.log.verbose.header = function() {
  return grunt.log;
};
grunt.log.verbose.subhead = function() {
  return grunt.log;
};

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

grunt.log.warn = function(msg) {
  log.warn('warn', msg || '');
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


// load tasks in NODE_PATH
grunt.loadGlobalTasks = function(name) {
  var NODE_PATH = process.env.NODE_PATH;
  if (!NODE_PATH) {
    grunt.log.error('Environment variable required: "NODE_PATH"');
    process.exit(1);
  }

  log.info('load', name + ' from NODE_PATH');

  var rootdir = path.join(NODE_PATH, name);
  var pkgfile = path.join(rootdir, 'package.json');
  var pkg = grunt.file.exists(pkgfile) ? grunt.file.readJSON(pkgfile): {keywords: []};

  var taskdir = path.join(rootdir, 'tasks');
  // Process collection plugins
  if (pkg.keywords && pkg.keywords.indexOf('gruntcollection') !== -1) {

    Object.keys(pkg.dependencies).forEach(function(depName) {
      var filepath = path.join(rootdir, 'node_modules', depName);
      if (grunt.file.exists(filepath)) {
        // Load this task plugin recursively
        grunt.loadGlobalTasks(path.relative(NODE_PATH, filepath));
      }
    });
    // Load the tasks of itself
    if (grunt.file.exists(taskdir)) {
      grunt.loadTasks(taskdir);
    }
    return;
  }
  if (grunt.file.exists(taskdir)) {
    grunt.loadTasks(taskdir);
  } else {
    grunt.log.error('Global task ' + name + ' not found.');
  }
};

grunt.invokeTask = function(name, options, fn) {
  grunt.option.init(options);

  getGruntfiles(function(files) {
    files.push(fn);
    files.some(function(gruntfile) {
      return runCli(name, gruntfile);
    });
  });
};

module.exports = grunt;


// helpers
function getGruntfiles(callback) {
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
}

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

function download(url, callback) {
  var tmp = process.env.TMPDIR || process.env.TEMP || process.env.TMP;
  var fpath = path.join(tmp, encodeURIComponent(url));
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
