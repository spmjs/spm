/**
 * @fileoverview Extensions for filesystem utilities.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var util = require('util');
var url = require('url');
var WinOS  = require('./win_os.js');

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
exports.mkdirS = function(dir) {
  dir = WinOS.normalizePath(dir);

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
    throw filename + ' load failure!';
  }
  return fileStr + '';
};

/**
 * 同步写入文件
 * @param {String} filePath 写入路径.
 * @param {String} fileContent 写入内容.
 */
exports.writeFileSync = function(filePath, fileContent) {
  var dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    exports.mkdirS(dir);
  }
  fs.writeFileSync(filePath, fileContent, 'utf8');
};

// 通过copy 目录.
exports.copydirSync = function(srcDirectory, targetDirectory) {
  if (!existsSync(targetDirectory)) {
    exports.mkdirS(targetDirectory);
  }

  if (srcDirectory.indexOf('.') == 0) {
    return;
  }

  var files = fs.readdirSync(srcDirectory);

  files.forEach(function(filename) {

    if (isFile(path.join(srcDirectory, filename))) {
        exports.copyFileSync(srcDirectory, targetDirectory, filename);
    } else if (isDirectory(path.join(srcDirectory, filename))) {
      var fileDir = path.join(targetDirectory, filename);
      !existsSync(fileDir) && fs.mkdirSync(fileDir);
      exports.copydirSync(path.join(srcDirectory, filename),
        path.join(targetDirectory, filename));
    }
  });
};

// 同步copy 文件.
exports.copyFileSync = function(srcDirectory, targetDirectory, filename) {
  var code = fs.readFileSync(path.join(srcDirectory, filename), 'utf8');
  fs.writeFileSync(path.join(targetDirectory, filename), code, 'utf8');
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
}

var perfectFilter = function(filter) {

  if (!filter) {
    return function() {
      return true;
    }
  }

  if (util.isRegExp(filter)) {
    return function(file) {
      filter.test(path.basename(file));
    }
  }

  return filter;
};

