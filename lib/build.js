/* publish modules to spmjs.org */

var fs = require('fs-extra');
var path = require('path');
var logging = require('colorful').logging;
var childexec = require('./utils').childexec;
var module = require('./sdk/module');
var transform = require('./sdk/transform').transform;
var concat = require('./sdk/concat').concat;
var compress = require('./sdk/compress').compress;


exports.run = function(options) {
  logging.start('Building');

  var data = module.parseOptions(options);
  var scripts = data.scripts || {};

  if (scripts.prebuild) {
    childexec(scripts.prebuild, function() {_build(data);});
  } else {
    _build(data);
  }
};

function _build(data) {
  var scripts = data.scripts || {};
  if (scripts.build) {
    childexec(scripts.build, function() {
      logging.end('End building');
      process.exit();
    });
  }
  var tmpdir = data.tmpdir || '.spm-build';
  transform(data.source, tmpdir, data);

  var rules = data.output;
  var encoding = data.encoding || 'utf8';
  concat(tmpdir, data.destination, rules, encoding);
  fs.removeSync(tmpdir);

  compress(data.destination, data.destination, encoding);

  logging.end('End building');
}
