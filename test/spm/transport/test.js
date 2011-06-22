// vim: set ts=2 sw=2:

var build = require('../../../lib/spm/actions/transport');

exports.run = function() {
  var a = new build();
  console.log(a.help);
};
