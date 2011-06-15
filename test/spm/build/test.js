// vim: set ts=2 sw=2:

var build = require('../../../lib/spm/actions/build');

exports.run = function() {
  var a = new build();
  a.help();
};
