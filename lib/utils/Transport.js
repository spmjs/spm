/**
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var url = require('url');

var Annotation = require('./Annotation');
var Net = require('./Net');


var Transport = exports;


Transport.parse = function(uri, callback, config) {
  config || (config = {});
  var charset = config.charset;

  Net.readFromPath(uri, function(text) {
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

