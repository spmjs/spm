 // fileoverview Extensions for filesystem utilities.

var fs = require('fs');
var path = require('path');
var util = require('util');
var url = require('url');
var glob = require('glob');
var env = require('./env.js');

var isDirectory = exports.isDirectory = function(filepath) {
  return fs.statSync(filepath).isDirectory();
};

var isFile = exports.isFile = function(filepath) {
  return fs.statSync(filepath).isFile();
};

/**
 * rm -rf dir.
 */
exports.rmdirRF = function(dir) {
  if (!existsSync(dir)) return;

  fs.readdirSync(dir).forEach(function(name) {
    var item = path.join(dir, name);

    if (isFile(item)) {
      fs.unlinkSync(item);
    }
    else {
      exports.rmdirRF(item);
    }
  });

  fs.rmdirSync(dir);
};


/**
 * mkdir -s dir.
 */
var mkdirS = exports.mkdirS = function(dir) {
  dir = env.normalizePath(dir);

  var p = dir.replace(/\/$/, '');
  var parts = [];

  while (!/\/$/.test(p) && !existsSync(p)) {
    parts.unshift(path.basename(p));
    p = path.dirname(p);
  }

  while (parts.length) {
    p = path.join(p, parts.shift());
    fs.mkdirSync(p, '0777');
  }
};


/**
 * read content from http(s)/local filesystem
 */
exports.readFile = function(uri, callback, charset) {
  if (!uri || typeof callback !== 'function') {
    return;
  }

  console.log('  ... Fetching %s', uri);

  // read from network
  if (/^https?:\/\//.test(uri)) {

    var options = url.parse(uri);
    options.path = options.pathname;
    var request = require(options.protocol.slice(0, -1));

    var req = request.get(options, function(res) {

      // 200
      if (res.statusCode === 200) {
        var data = '';
        var times = 0;

        res.on('data', function(chuck) {
          if (++times > 2) {
            process.stdout.write(times === 3 ? '  ...' : '.');
          }
          data += chuck.toString();
        });

        res.on('end', function() {
          if (times > 2) {
            process.stdout.write('\n');
          }
          callback(data);
        });

        return;
      }

      // redirect
      var redirect = res.headers['location'];
      if (redirect) {
        exports.readFile(redirect, callback);
      }

      // others
      else {
        console.error('Error: No data received from %s.', uri);
        callback('');
      }

    });

    req.on('error', function(e) {
      console.error(e.message);
      callback('');
    });
  }
  // read from local filesystem
  else {
    return fs.readFile(uri, charset || 'utf8', function(err, data) {
      if (err) throw err + '\n       uri = ' + uri;
      callback(data);
    });
  }
};

/**
 * 同步读取文件内容
 * @param {String} filePath 文件路径.
 * @param {String} filename 文件名.
 * @return {String} 文件内容.
 */
exports.readFileSync = function(filePath, filename) {
  var fileStr = null;
  try {
    fileStr = fs.readFileSync(path.join(filePath, filename), 'utf8');
  } catch (e) {
    throw filePath + ' load failure!';
  }
  return fileStr + '';
};

/**
 * 同步写入文件
 * @param {String} filePath 写入路径.
 * @param {String} fileContent 写入内容.
 */
var writeFileSync = exports.writeFileSync = function(filePath, fileContent) {
  var dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    exports.mkdirS(dir);
  }
  fs.writeFileSync(filePath, fileContent, 'utf8');
};

// 通过copy 目录.
exports.copydirSync = function(src, target) {
  if (!existsSync(target)) {
    exports.mkdirS(target);
  }

  list(src).forEach(function(filename) {
    exports.copyFileSync(src, target, filename);
  });
};

// 同步copy 文件.
exports.copyFileSync = function(src, target, filename) {
  var code = fs.readFileSync(path.join(src, filename), 'utf8');
  writeFileSync(path.join(target, filename), code);
};

// copy 文件.
exports.copyFile = function(srcDirectory, targetDirectory, filename, callback) {
  fs.createReadStream(path.join(srcDirectory, filename)).
      pipe(fs.createWriteStream(path.join(targetDirectory, filename))).
      on('close', function() {
        callback();
      });
};

/**
 * convert `path/to/a` to `path/to/a/`
 */
exports.normalizeEndSlash = function(p) {
  if (!/\/$/.test(p)) {
    p += '/';
  }
  return p;
};

var existsSync = exports.existsSync = function(filepath) {
  if (fs.existsSync) {
    return fs.existsSync(filepath);
  } else {
    return path.existsSync(filepath);
  }
};


// 根据用户提供的filter, 返回所有文件的相对地址.
var list = exports.list = function(dir, filter) {
  var files = listFiles(dir, filter) || [];

  return files.map(function(file) {
    return path.relative(dir, file);
  });
};

// 返回所有文件的绝对地址.
var listFiles = exports.listFiles = function(dir, filter, files) {
  filter = perfectFilter(filter);
  files = files || [];

  // 对于隐藏目录不处理.
  if (path.basename(dir).indexOf('.') === 0) {
    return files;
  }

  if (isDirectory(dir)) {
    fs.readdirSync(dir).forEach(function(filename) {
      var file = path.join(dir, filename);
      listFiles(path.join(dir, filename), filter, files);
    });
  } else if (isFile(dir) && filter(dir)) {
    files.push(dir);
  }
  return files;
};

var perfectFilter = function(filter) {

  if (!filter) {
    return function() {
      return true;
    };
  }

  if (util.isRegExp(filter)) {
    return function(file) {
      return filter.test(path.basename(file));
    };
  }

  return filter;
};

var listDirs = exports.listDirs = function(dir, filter) {
  var dirs = fs.readdirSync(dir).filter(function(name) {
    if (isFile(path.join(dir, name))) return false; 
    if (filter) {
      if (typeof filter === 'function') return filter(name);
      if (filter.test) return filter.test(name);
    }
    return true;
  });
  return dirs;
};

// 完善本地路径
exports.perfectLocalPath = function(localPath) {
  if (localPath.indexOf('~') === 0) {
    return localPath.replace(/~/, home);
  }

  if (env.isAbsolute(localPath)) {
    return localPath;
  }

  return path.join(process.cwd(), localPath);
};

// 基于某个目录获取指定规则下面的文件.
// 具体语法参看 https://github.com/isaacs/node-glob
var globFiles = exports.globFiles = function(rule, base) {
  if (Array.isArray(rule)) {
    var files = [];
    rule.forEach(function(r) {
      var _files = globFiles.call(exports, r, base);
      if (!_files || _files.length === 0) {
        _files = [r];
      }
      [].splice.apply(files, [files.length, 0].concat(_files));
    });
    return files;
  } else {
    return glob.sync(rule, {cwd: base || process.cwd()});
  }
};
