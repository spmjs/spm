/**
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var url = require('url');

var Annotation = require('./Annotation');


var Transport = exports;


Transport.parse = function(uri, callback, config) {
  config || (config = {});
  var charset = config.charset;

  readFromPath(uri, function(text) {
    var comments, template;

    template = text.replace(/\/\*\*([\s\S]*?)\*\/\s*/g, function(all) {
      comments = all;
      return '\n';
    });

    var meta = Annotation.parse(comments);

    // compatible for npm package.json
    if (meta['package']) {

      // base dir is the one which include tspt file.
      if (!/^(\/|https?:\/\/)/.test(meta['package'])) {
        meta['package'] = fs.realpathSync(
            uri.replace(/(.*\/).*$/, '$1') + meta['package']);
      }

      readFromPath(meta['package'], function(config) {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.warn('%s parse error.', meta['package']);
          config = {};
        }

        for (var i in config) {
          // priority: transport.js > package.json
          if (i in meta) continue;
          meta[i] = config[i];
        }

        callback({
          meta: meta,
          template: template
        });

      });
    }

    // all config from transport files
    else {
      callback({
        meta: meta,
        template: template
      });
    }

  }, charset);

};


function readFromPath(uri, callback, charset) {
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
        readFromPath(redirect, callback);
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
}
