/**
 * @fileoverview Extensions for filesystem utilities.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');
var url = require('url');


/**
 * rm -rf dir.
 */
exports.rmdirRF = function(dir) {
  if (!path.existsSync(dir)) return;

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
  if (!path.existsSync(dir)) {
    fs.mkdirSync(dir, '0777');
  }
};


/**
 * read content from http(s)/local filesystem
 */
exports.readFromPath = function(uri, callback, charset) {
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
        exports.readFromPath(redirect, callback);
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
