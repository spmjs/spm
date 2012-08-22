define(function(require, exports) {
  var $ = require('$');
  var widget = require('widget');
  var moduleA = require('./a.js');
  var moduleB = require('./b.js');
  var modulec = require('./c.js');

  exports.get = function(id) {
    var dom = $(id);
    widget.render(dom, module);
  };
});

