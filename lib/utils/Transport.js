// vim: ts=2 sw=2:

/**
 * @fileoverview tspt file parser.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');

var Annotation = require('./Annotation');


var Transport = exports;


// we need tspt path to get the base dir.
Transport.parse = function(uri, callback) {

  readFromPath(uri, function(text) {
    var comments, template;

    // TODO: parse comments from uglify-js tokenizer.
    template = text.replace(/\/\*\*([\s\S]*?)\*\/\s*/g, function(all) {
      comments = all;
      return '\n';
    });

    var meta = annotation.parse(comments);

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

  });

  return this;
};


/**
 * Read content from filepath.
 * @param {string} filepath currently support http/https/filesystem.
 * @param {function} callback Callback to read content.
 */
function readFromPath(filepath, callback) {
  if (!filepath || typeof callback !== 'function') {
    return;
  }

  var uri = filepath;

  // read from network, support http/https currently.
  if (/^https?:\/\//.test(uri)) {
    uri = url.parse(uri);
    uri.path = uri.pathname;

    require(uri.protocol.slice(0, -1)).get(uri, function(res) {

      if (res.statusCode === 200) {
        var data = '';
        res.on('data', function(chuck) { data += chuck.toString(); })
           .on('end', function() { callback(data); });
        return;
      }

      var redirect = res.headers['location'];
      if (redirect) {
        exports.readFromPath(redirect, callback);
      }
      else {
        console.error('No data received from %s.', filepath);
        callback('');
      }

    }).on('error', function(e) {
      console.error(e.message);
      callback('');
    });
  }
  // read from local filesystem
  else {
    path.exists(uri, function(exists) {
      if (exists) {
        fs.readFile(uri, function(err, data) {
          if (!err) {
            callback(data.toString());
          } else {
            console.error(err.toString());
            callback('');
          }
        });
      } else {
        console.error('File Not Found: %s', uri);
        callback('');
      }
    });
  }
};


/**
 * Download a file stream.
 * @param {string} uri filepath, currently support http/https/filesystem.
 * @param {string} filename local filename.
 * @param {function} callback Callback to read content.
 */
function download(uri, filename, callback) {
  if (/^https?:\/\//.test(uri)) {
    exports.readFromPath(uri, function(data) {
      fs.writeFile(filename, data, callback);
    });
  }
};