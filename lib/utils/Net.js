/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');


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


exports.download = function() {
  
}
