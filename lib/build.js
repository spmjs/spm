/* publish modules to spmjs.org */

var fs = require('fs-extra');
var path = require('path');
var logging = require('colorful').logging;
var childexec = require('./utils').childexec;
var module = require('./sdk/module');
var transform = require('./sdk/transform');
var concat = require('./sdk/concat');


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
  // 1. transform
  transform.transform(data.source, '.spm-build', data);
  var rules = data.output;
  var encoding = data.encoding || 'utf8';
  //concat.concat('.spm-build', data.destination, rules, encoding);
  logging.end('End building');
}
