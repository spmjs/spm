// vim: ts=2 sw=2:

/**
 * @fileoverview tspt file parser.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs'),
    annotation = require('./annotation'),
    util = require('../util');

var tspt = exports;

// we need tspt path to get the base dir.
tspt.parse = function(uri, callback) {

  util.readFromPath(uri, function(text) {
    var comments, template;

    // TODO parse comments from uglify-js tokenizer.
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

      util.readFromPath(meta['package'], function(config) {
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
