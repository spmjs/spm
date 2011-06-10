// vim: set ts=2 sw=2:
var assert = require('assert'),
    fs = require('fs'), path = require('path'),
    util = require('../../../lib/util');

var getFile = function(p) {
  return path.join(__dirname, p);
};

var transport = require('../../../lib/spm/transport');

exports.run = function() {
  util.readFromPath(getFile('remote-package.tspt'), function(comments) {
    transport.parseTemplate(comments, function(o) {
      var meta = o.meta;
      assert.equal(meta.name, 'SeaJS');
    });
  });
};
