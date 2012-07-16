/**
 * @fileoverview Extensions for filesystem utilities.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var url = require('url');
var WinOS  = require('./win_os.js');


/**
 * rm -rf dir.
 */
exports.rmdirRF = function(dir) {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir).forEach(function(name) {
    var item = path.join(dir, name);

    if (fs.statSync(item).isFile()) {
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

  while (!/\/$/.test(p) && !fs.existsSync(p)) {
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
 * convert `path/to/a` to `path/to/a/`
 */
exports.normalizeEndSlash = function(p) {
  if (!/\/$/.test(p)) {
    p += '/';
  }
  return p;
};
