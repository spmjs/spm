// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm search.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var Net = require('../utils/Net');


var Search = ActionFactory.create('Search');


Search.prototype.run = function(opts) {
  opts = opts || {};
  var mods = opts.mods || [];

  // TODO current support for only one arguments
  var query = mods[0];
  Net.readFromPath(CONFIG.SEARCH + encodeURIComponent(query),
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


module.exports = Search;
