/**
 * @fileoverview Extensions for filesystem utilities.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');


/**
 * rm -rf dir.
 */
exports.rmdirRF = function(dir) {

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
    fs.mkdirSync(dir, '0766');
  }
};


/**
 * read content from http(s)/local filesystem
 */
exports.readFromPath = function(uri, callback, charset) {
  if (!uri || typeof callback !== 'function') {
    return;
  }

  // read from network
  if (/^https?:\/\//.test(uri)) {
    uri = url.parse(uri);
    uri.path = uri.pathname;
    var request = require(uri.protocol.slice(0, -1));

    request.get(uri, function(res) {
      // 200
      if (res.statusCode === 200) {
        var data = '';

        res.on('data', function(chuck) {
          data += chuck.toString();
        });

        res.on('end', function() {
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
        console.error('No data received from %s.', uri);
        callback('');
      }
    });

    request.on('error', function(e) {
      console.error(e.message);
      callback('');
    });
  }
  // read from local filesystem
  else {
    return fs.readFileSync(uri, charset || 'utf-8');
  }
};
