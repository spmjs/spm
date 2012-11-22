 // fileoverview Extensions for filesystem utilities.

require('shelljs/global');

var fs = require('fs');
var path = require('path');
var util = require('util');
var url = require('url');
var glob = require('glob');

var env = require('./env.js');
var opts = require('./opts').get();

opts.add('encoding', 'Set file encoding!');
opts.defaultValue('encoding', 'utf8');

var argv = opts.argv;
// console.log('file encoding: ' + argv.encoding);

var isDirectory = exports.isDirectory = function(filepath) {
  if (!existsSync(filepath)) return false;

  return fs.statSync(filepath).isDirectory();
};

var isFile = exports.isFile = function(filepath) {
  if (!existsSync(filepath)) return false;

  return fs.statSync(filepath).isFile();
};

/**
 * rm -rf dir.
 */
exports.rmdirRF = function(dir) {
  rm('-rf', dir);
};

exports.rmSync = function(dir) {
  rm('-rf', dir);
};

/**
 * mkdir -s dir.
 */
var mkdirS = exports.mkdirS = function(dir) {
  dir = env.normalizePath(dir);
  mkdir('-p', dir);
};

/**
 * read content from http(s)/local filesystem
 */
exports.readFile = function(uri, callback, charset) {
  if (!uri || typeof callback !== 'function') {
    return;
  }

  console.log('  ... Fetching ', uri);

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
    return fs.readFile(uri, charset || argv.encoding, function(err, data) {
      if (err) throw new Error(err + '\n       uri = ' + uri);
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
    fileStr = fs.readFileSync(path.join(filePath, filename), argv.encoding);
    if (fileStr.indexOf('\ufeff') === 0) {
      fileStr = fileStr.substring(1, fileStr.length);
    }
  } catch (e) {
    throw new Error(filePath + ' ' + filename + ' load failure!');
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
  fs.writeFileSync(filePath, fileContent, argv.encoding);
};

// 通过copy 目录.
exports.copydirSync = function(src, target, filter) {
  filter = perfectFilter(filter);
  if (!existsSync(target)) {
    exports.mkdirS(target);
  }

  // TODO test
  // cp(path.join(src, '*'), target);

  list(src).forEach(function(filename) {
    if (!filter(filename)) return;
    exports.copyFileSync(src, target, filename);
  });
};

// 同步copy 文件.
exports.copyFileSync = function(src, target, filename){
    var srcFile = path.join(src, filename);
    var destFile = path.join(target, filename);

    var destDir = path.dirname(destFile);
    if (!existsSync(destDir)) {
        exports.mkdirS(destDir);
    }

    var BUF_LENGTH = 64*1024;

    var buff = new Buffer(BUF_LENGTH);
    var fdr = fs.openSync(srcFile, 'r');
    var fdw = fs.openSync(destFile, 'w');
    var bytesRead = 1;
    var pos = 0;
    while(bytesRead > 0) {
        bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw,buff,0,bytesRead);
        pos += bytesRead;
    }
    fs.closeSync(fdr);
    fs.closeSync(fdw);
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
  if (!existsSync(dir)) {
    return [];
  }

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
// 如果指定 isMod 增加 './'
var globFiles = exports.globFiles = function(rule, base, isMod) {
  var files;
  if (Array.isArray(rule)) {
    files = [];
    rule.forEach(function(r) {
      var _files = globFiles.call(exports, r, base);
      if (!_files || _files.length === 0) {
        _files = [r];
      }
      [].splice.apply(files, [files.length, 0].concat(_files));
    });
  } else {
    files = glob.sync(rule, {cwd: base || process.cwd()});
  }
  if (isMod) {
    files = files.map(function(f) {
      if (f.indexOf('.') !== 0) {
        return './' + f;
      }
      return f;
    });
  }
  return files;
};
