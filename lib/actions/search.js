// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm search.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var factory = require('../lib/actionFactory'),
    message = require('../i18n/message'),
    fs = require('fs'),
    path = require('path'),
    util = require('../../util'),
    CONFIG = require('../config');


var Search = factory.create(function() {
});


Search.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {};

  // TODO current support for only one arguments
  var query = mods[0];
  util.readFromPath(CONFIG.SEARCH + encodeURIComponent(query),
      function(data) {
        var results = [];
        try {
          data = JSON.parse(data);
        } catch (e) {
          data = {};
        }
        for (var i in data) {
          results.push(data[i]);
        }

        if (results.length === 0) {
          console.log('No result found: %s', query.yellow.bold);
          // TODO query fix.
          return;
        }

        console.log('Found %s result%s.',
            results.length.toString().yellow.bold,
            results.length === 1 ? '' : 's');
        results.forEach(function(result) {
          console.log(' %s@%s'.bold,
              result.name.green,
              result.version.cyan);
          if (result.author)
            console.log('  |-by %s', result.author.yellow);
          if (result.description)
            console.log('  |-%s', result.description);
        });
      });
};


Search.prototype.__defineGetter__('help', function() {
  var msg = message.REMOVE_HELP;
  if (!this.config.global) {
    msg += '\n' + message.REMOVE_HELP_OPTIONS;
  }
  return msg;
});

module.exports = Search;
