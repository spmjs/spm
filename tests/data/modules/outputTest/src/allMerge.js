define(function(require, exports) {
  var $ = require('$');
  var widget = require('widget');
  var moduleA = require('./a');
  var moduleB = require('./b');
  var modulec = require('./c');

  var p1 = require('./plugins/p1');
  var p2 = require('./plugins/p2');

  exports.get = function(id) {
    var dom = $(id);
    widget.render(dom, module);
  };
});
