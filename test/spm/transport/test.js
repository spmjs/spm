// vim: set ts=2 sw=2:
var assert = require('assert'),
    fs = require('fs'), path = require('path'),
    util = require('../../../lib/util'),
    console = require('../../../lib/spm/log');

var getFile = function(p) {
  return path.join(__dirname, p);
};

var transport = require('../../../lib/spm/transport');

var justCall = function(fn) {
  fn();
};

exports.run = function() {
  specs.forEach(justCall);
};

var specs = [
  function() {
    util.readFromPath(getFile('remote-package.tspt'), function(comments) {
      transport.parseTemplate(comments, function(o) {
        var meta = o.meta;
        assert.equal(meta.name, 'SeaJS', 'support remote json');
      });
    });
  },
  function() {
    util.readFromPath(getFile('remote-package-overwrite.tspt'),
        function(comments) {
          transport.parseTemplate(comments, function(o) {
            var meta = o.meta;
            assert.equal(
                meta.version, '0.1.0',
                'support remote json overwrite');
          });
        }
    );
  },
  function() {
    util.readFromPath(getFile('local-package.tspt'),
        function(comments) {
          transport.parseTemplate(comments, function(o) {
            var meta = o.meta;
            assert.equal(meta.name, 'SeaJS', 'support local json');
          });
        }
    );
  }
];
