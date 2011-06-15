// vim: ts=2 sw=2:

/**
 * @fileoverview tspt file parser.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var annotation = require('./annotation'),
    util = require('../../util');

var tspt = exports;

tspt.parse = function(text, callback) {
  var comments, template;

  template = text.replace(/\/\*\*([\s\S]*?)\*\/\s*/g, function(all) {
    comments = all;
    return '\n';
  });

  var meta = annotation.parse(comments);

  // compatible for npm package.json
  if (meta['package']) {

    // transports forlder is a base folder
    // TODO base dir should refactor to the same dir as .tspt file
    if (!/^(\/|https?:\/\/)/.test(meta['package'])) {
      meta['package'] = path.join(__dirname,
          '../../transports', meta['package']);
    }

    util.readFromPath(meta['package'], function(config) {
      try {
        config = JSON.parse(config);
      } catch (e) {
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

  return this;
};
